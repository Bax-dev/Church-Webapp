/// <reference path="./.sst/platform/config.d.ts" />

/**
 * AWS infrastructure: the Next.js app on Lambda (arm64) behind CloudFront, a private S3 bucket for uploads (s3.ts)
 * and a DynamoDB table for short-lived keys (kv.ts). Postgres is not created here: DATABASE_URL points at an
 * existing PostgreSQL server (see infra/README.md). Deployed by .github/workflows/deploy.yml.
 */
export default $config({
  app(input) {
    return {
      name: 'pcn-app',
      home: 'aws',
      // Production data (uploads, sessions) survives `sst remove`; other stages are cleaned up.
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: input?.stage === 'production',
      providers: { aws: { region: process.env.AWS_REGION ?? 'eu-west-1' } },
    }
  },
  async run() {
    const need = (name: string) => {
      const value = process.env[name]
      if (!value) throw new Error(`Set ${name} before deploying (see infra/README.md).`)
      return value
    }
    // Optional settings are passed through only when set, so the app's own defaults apply otherwise.
    const optional = (...names: string[]) =>
      Object.fromEntries(names.flatMap((name) => (process.env[name] ? [[name, process.env[name]!]] : [])))

    const uploads = new sst.aws.Bucket('Uploads')

    const kv = new sst.aws.Dynamo('Kv', {
      fields: { pk: 'string', sk: 'string' },
      primaryIndex: { hashKey: 'pk', rangeKey: 'sk' },
      ttl: 'expiresAt',
    })

    const domain = process.env.DOMAIN || undefined

    const site = new sst.aws.Nextjs('Site', {
      // Linking grants the server function read/write access to the bucket and the table.
      link: [uploads, kv],
      domain,
      // arm64 is ~20% cheaper per GB-second; the deploy job builds on arm64 so native modules match.
      server: { architecture: 'arm64', memory: '1024 MB', runtime: 'nodejs24.x' },
      environment: {
        S3_BUCKET: uploads.name,
        DYNAMODB_TABLE: kv.name,
        DATABASE_URL: need('DATABASE_URL'),
        JWT_ACCESS_SECRET: need('JWT_ACCESS_SECRET'),
        JWT_REFRESH_SECRET: need('JWT_REFRESH_SECRET'),
        APP_URL: process.env.APP_URL || (domain ? `https://${domain}` : need('APP_URL')),
        ...optional(
          'ACCESS_TOKEN_TTL', 'REFRESH_TOKEN_TTL', 'NEXT_PUBLIC_SITE_URL',
          'EMAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
          'RESEND_API_KEY', 'RESEND_FROM',
        ),
      },
    })

    return { url: site.url, bucket: uploads.name, table: kv.name }
  },
})
