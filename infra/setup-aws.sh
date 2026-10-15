#!/usr/bin/env bash
# One-time AWS + GitHub setup for the deploy pipeline (see infra/README.md). Run from the repo root:
#   AWS_PROFILE=workiva bash infra/setup-aws.sh
# Creates: deploy role pcn-github-deploy (scoped policy), RDS PostgreSQL pcn-app-db (db.t4g.micro), its security group,
# SSM SecureStrings /pcn-app/production/{db-password,database-url}, and the GitHub `production` environment with its
# variables and secrets. Secrets are generated here and piped straight to SSM/GitHub; nothing secret is printed.
set -euo pipefail

export AWS_REGION="${AWS_REGION:-eu-west-1}"
REPO="Bax-dev/Church-Webapp"
ACCT=$(aws sts get-caller-identity --query Account --output text)
echo "Account ${ACCT}, region ${AWS_REGION}, repo ${REPO}"
read -r -p "Continue? [y/N] " ok; [[ "$ok" == "y" ]] || exit 1

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

# --- GitHub OIDC provider (reused if it already exists)
if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::${ACCT}:oidc-provider/token.actions.githubusercontent.com" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com >/dev/null
  echo "OIDC provider created"
fi

# --- Deploy role: only this repo's `production` environment can assume it.
# The token's `sub` prefix depends on the repo's OIDC settings: newer repos use the immutable form
# `repo:owner@ownerId/name@repoId`, older ones `repo:owner/name`. Ask GitHub rather than guess.
SUB_PREFIX=$(gh api "repos/${REPO}/actions/oidc/customization/sub" --jq '.sub_claim_prefix // empty' 2>/dev/null || true)
SUB_PREFIX="${SUB_PREFIX:-repo:${REPO}}"
cat > "$TMP/trust.json" <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow",
 "Principal":{"Federated":"arn:aws:iam::${ACCT}:oidc-provider/token.actions.githubusercontent.com"},
 "Action":"sts:AssumeRoleWithWebIdentity",
 "Condition":{"StringEquals":{
   "token.actions.githubusercontent.com:aud":"sts.amazonaws.com",
   "token.actions.githubusercontent.com:sub":"${SUB_PREFIX}:environment:production"}}}]}
EOF
# Full access only to the services SST uses; IAM limited to the app's own roles.
cat > "$TMP/policy.json" <<EOF
{"Version":"2012-10-17","Statement":[
 {"Sid":"SstServices","Effect":"Allow","Action":[
   "lambda:*","cloudfront:*","cloudfront-keyvaluestore:*","s3:*","dynamodb:*","sqs:*",
   "ssm:*","logs:*","acm:*","route53:*","events:*","sts:GetCallerIdentity"],"Resource":"*"},
 {"Sid":"AppRolesOnly","Effect":"Allow","Action":[
   "iam:CreateRole","iam:DeleteRole","iam:GetRole","iam:UpdateRole","iam:TagRole","iam:UntagRole",
   "iam:UpdateAssumeRolePolicy","iam:PutRolePolicy","iam:GetRolePolicy","iam:DeleteRolePolicy",
   "iam:AttachRolePolicy","iam:DetachRolePolicy","iam:ListRolePolicies","iam:ListAttachedRolePolicies",
   "iam:ListInstanceProfilesForRole","iam:PassRole"],
  "Resource":"arn:aws:iam::${ACCT}:role/pcn-app-*"},
 {"Sid":"ServiceLinkedRoles","Effect":"Allow","Action":"iam:CreateServiceLinkedRole","Resource":"*",
  "Condition":{"StringLike":{"iam:AWSServiceName":["lambda.amazonaws.com","replicator.lambda.amazonaws.com","logger.cloudfront.amazonaws.com"]}}}
]}
EOF
if ! aws iam get-role --role-name pcn-github-deploy >/dev/null 2>&1; then
  aws iam create-role --role-name pcn-github-deploy --assume-role-policy-document "file://$TMP/trust.json" \
    --description "GitHub Actions production deploys for ${REPO}" >/dev/null
  echo "Role pcn-github-deploy created"
else
  aws iam update-assume-role-policy --role-name pcn-github-deploy --policy-document "file://$TMP/trust.json"
fi
aws iam put-role-policy --role-name pcn-github-deploy --policy-name sst-deploy --policy-document "file://$TMP/policy.json"
ROLE_ARN="arn:aws:iam::${ACCT}:role/pcn-github-deploy"

# --- PostgreSQL: public endpoint, TLS required (PostgreSQL 17 default), password from SSM
if ! aws rds describe-db-instances --db-instance-identifier pcn-app-db >/dev/null 2>&1; then
  VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
  SG=$(aws ec2 create-security-group --group-name pcn-app-db --vpc-id "$VPC" \
    --description "PCN Postgres: TLS-only, reached by Lambda and GitHub Actions" --query GroupId --output text)
  aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 5432 --cidr 0.0.0.0/0 >/dev/null
  PW=$(openssl rand -hex 24)
  aws ssm put-parameter --name /pcn-app/production/db-password --type SecureString --overwrite --value "$PW" >/dev/null
  aws rds create-db-instance --db-instance-identifier pcn-app-db --engine postgres --engine-version 17.11 \
    --db-instance-class db.t4g.micro --allocated-storage 20 --storage-type gp3 --storage-encrypted \
    --master-username pcnadmin --master-user-password "$PW" --db-name church \
    --publicly-accessible --vpc-security-group-ids "$SG" --no-multi-az \
    --backup-retention-period 7 --deletion-protection --copy-tags-to-snapshot --auto-minor-version-upgrade \
    --tags Key=app,Value=pcn-app >/dev/null
  echo "RDS pcn-app-db creating (about 10 minutes)..."
fi
aws rds wait db-instance-available --db-instance-identifier pcn-app-db
HOST=$(aws rds describe-db-instances --db-instance-identifier pcn-app-db --query 'DBInstances[0].Endpoint.Address' --output text)
PW=$(aws ssm get-parameter --name /pcn-app/production/db-password --with-decryption --query Parameter.Value --output text)
DATABASE_URL="postgresql://pcnadmin:${PW}@${HOST}:5432/church?sslmode=require"
aws ssm put-parameter --name /pcn-app/production/database-url --type SecureString --overwrite --value "$DATABASE_URL" >/dev/null
echo "RDS ready: ${HOST}"

# --- GitHub environment `production`, deployable from main only
gh api -X PUT "repos/${REPO}/environments/production" --input - >/dev/null <<'EOF'
{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
EOF
gh api -X POST "repos/${REPO}/environments/production/deployment-branch-policies" -f name=main -f type=branch >/dev/null 2>&1 || true
gh variable set AWS_ROLE_ARN --env production --repo "$REPO" --body "$ROLE_ARN"
gh variable set AWS_REGION --env production --repo "$REPO" --body "$AWS_REGION"
gh variable list --env production --repo "$REPO" | grep -q '^APP_URL' ||
  gh variable set APP_URL --env production --repo "$REPO" --body https://replace-after-first-deploy.invalid
printf '%s' "$DATABASE_URL" | gh secret set DATABASE_URL --env production --repo "$REPO"
gh secret list --env production --repo "$REPO" | grep -q '^JWT_ACCESS_SECRET' ||
  openssl rand -base64 48 | tr -d '\n' | gh secret set JWT_ACCESS_SECRET --env production --repo "$REPO"
gh secret list --env production --repo "$REPO" | grep -q '^JWT_REFRESH_SECRET' ||
  openssl rand -base64 48 | tr -d '\n' | gh secret set JWT_REFRESH_SECRET --env production --repo "$REPO"

echo
echo "Done. Role: ${ROLE_ARN}"
echo "Next: push to main (or run the Deploy workflow), then set APP_URL to the printed CloudFront URL."
