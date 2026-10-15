# Deploying to AWS

> **Already set up (2026-10-15), account 552648195884, eu-west-1:** GitHub OIDC provider; role `pcn-github-deploy`
> (inline policy `sst-deploy`, scoped to SST's services, IAM limited to `pcn-app-*` roles); RDS `pcn-app-db`
> (PostgreSQL 17, db.t4g.micro, security group `sg-0f6c42c4373cf7bed`, deletion protection on); SSM SecureStrings
> `/pcn-app/production/db-password` and `/pcn-app/production/database-url`; the GitHub `production` environment
> (deploys from `main` only) with `AWS_ROLE_ARN`, `AWS_REGION`, `APP_URL`, `DATABASE_URL`, `JWT_*`.
> Read the database URL with:
> `aws ssm get-parameter --region eu-west-1 --name /pcn-app/production/database-url --with-decryption --query Parameter.Value --output text`

| Piece | Where it runs | Defined in |
|---|---|---|
| Next.js app | Lambda (arm64) behind CloudFront, static files in S3 | `sst.config.ts` |
| Uploads (member photos, pastor photos, site images) | Private S3 bucket, keys `photos/`, `pastors/`, `site/` | `sst.config.ts`, `src/lib/server/s3.ts` |
| Sessions, one-time links, rate limits, stats cache | DynamoDB on-demand table, TTL on `expiresAt` | `sst.config.ts`, `src/lib/server/kv.ts` |
| Database | PostgreSQL you provide (`DATABASE_URL`) | not managed by SST |
| Pipeline | GitHub Actions: `ci.yml` on every PR, `deploy.yml` on push to `main` | `.github/workflows/` |

The Lambda is not placed in a VPC, so no NAT Gateway (about $32/month) is needed. It reaches Postgres over the internet with TLS.

## 1. PostgreSQL

The cheapest AWS option is RDS PostgreSQL `db.t4g.micro` with 20 GB gp3. It is free for 12 months on a new account, then about $15/month. Because the Lambda and the GitHub runner connect from outside a VPC:

- Set **Public access: Yes** and a long random master password.
- Security group: allow inbound 5432. Lambda has no fixed IP, so this is `0.0.0.0/0`. Protection comes from TLS and the password.
- Keep `rds.force_ssl = 1` (the default on PostgreSQL 15+) and connect with `?sslmode=require`:
  `postgresql://USER:PASSWORD@HOST:5432/church?sslmode=require`
- Turn on automated backups (7 days is free up to the database size).

Any other PostgreSQL server works the same way; only `DATABASE_URL` changes.

## 2. AWS role for GitHub Actions (one time)

The workflow signs in with OpenID Connect, so no AWS access keys are stored in GitHub.

1. IAM → Identity providers → Add provider → OpenID Connect
   - URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`
2. IAM → Roles → Create role → Web identity → that provider, audience `sts.amazonaws.com`
   - GitHub organization `Bax-dev`, repository `Church-Webapp`, environment `production`
   - Check that the trust policy's `sub` condition is `repo:Bax-dev/Church-Webapp:environment:production`.
3. Permissions: SST creates Lambda functions, CloudFront distributions, S3 buckets, a DynamoDB table, IAM roles and SSM parameters. Grant enough for that. Many teams start with `AdministratorAccess` on this role, which is limited by the trust policy above to production deploys from this repo. Narrow it if your account rules require.
4. Copy the role ARN.

## 3. GitHub settings

Settings → Environments → New environment `production`. Optionally restrict it to the `main` branch and require a reviewer.

**Variables:**

| Name | Example |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/pcn-github-deploy` |
| `AWS_REGION` | `eu-west-1` |
| `APP_URL` | `https://portal.example.org`. Not needed if `DOMAIN` is set |
| `DOMAIN` | optional, e.g. `portal.example.org` (see step 5) |
| `EMAIL_FROM`, `RESEND_FROM` | optional |

**Secrets:**

| Name | Notes |
|---|---|
| `DATABASE_URL` | from step 1 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -base64 48`, two different values |
| `RESEND_API_KEY` or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` | email delivery |

## 4. First deploy

Push to `main` or run **Deploy** from the Actions tab. The job:

1. installs dependencies on an **arm64 Linux** runner, so `@node-rs/argon2` gets the binary that the arm64 Lambda can load
2. runs `yarn typecheck`
3. runs `yarn db:migrate` against `DATABASE_URL`
4. runs `sst deploy --stage production` and prints the CloudFront `url`, bucket and table

If you don't have a domain yet, set `APP_URL` to any placeholder. After the first deploy, set it to the printed CloudFront URL and run Deploy again, so emailed links point to the right place.

Then create the first admin once from your machine:
`DATABASE_URL='…' SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… yarn db:seed`

### Moving existing uploads

Files under `uploads/` on an existing server use the same layout as the bucket:
`aws s3 sync uploads/ s3://<bucket from the deploy output>/`

## 5. Custom domain (optional)

If the domain's DNS is in Route 53, set `DOMAIN` and SST creates the certificate and records. For DNS elsewhere, see SST's docs for `domain.dns: false` with a manually validated ACM certificate in `us-east-1`.

## Rough monthly cost at low traffic

| | |
|---|---|
| Lambda, CloudFront, S3, DynamoDB | ~$0–2 (largely within the always-free tiers) |
| RDS db.t4g.micro + 20 GB | $0 for the first 12 months, then ~$15 |
| GitHub Actions | free tier |

## Local development

Nothing new is needed. With `S3_BUCKET` and `DYNAMODB_TABLE` empty in `.env.local`:

- uploads go to `UPLOAD_DIR` on disk, as before
- sessions are kept in memory, so they are lost when `yarn dev` restarts

To test against DynamoDB Local, set `DYNAMODB_ENDPOINT=http://localhost:8000` and `DYNAMODB_TABLE`, and create the table with keys `pk` (HASH, S) and `sk` (RANGE, S).
