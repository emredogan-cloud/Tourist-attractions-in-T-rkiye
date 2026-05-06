# Infrastructure

This directory holds the infrastructure-as-code for production rollout. The
codebase has been built provider-agnostic — a Vercel + Railway baseline plus
ready-to-go templates for AWS ECS / GCP Cloud Run deployments and a Cloudflare
edge layer for DDoS, WAF, and image transforms.

## Layout

```
infrastructure/
├── docker/                # Production docker images (api, worker)
├── terraform/             # Multi-cloud IaC for prod + DR
│   ├── aws/               # ECS Fargate + RDS Aurora + ElastiCache
│   ├── gcp/               # Cloud Run + Cloud SQL + Memorystore
│   └── cloudflare/        # WAF, rate-limit, page rules
├── k8s/                   # Helm charts (post-Cloud Run scale-out)
└── runbooks/              # Incident, chaos, deploy, oncall
```

## Multi-region topology (target)

```
                   Cloudflare (WAF / DDoS / CDN)
                              │
              ┌───────────────┼───────────────┐
        Frankfurt EU      Istanbul TR       Ankara DR
        (primary)         (low-lat)         (warm standby)
        ──────────        ──────────        ──────────
        ECS Fargate       ECS Fargate       ECS Fargate
        Aurora primary    Aurora reader     Aurora reader
        ElastiCache       ElastiCache       ElastiCache
        Meilisearch       Meilisearch       Meilisearch
        R2 (global)       R2 (global)       R2 (global)
```

- **Aurora** with cross-region replicas; `DATABASE_URL` points at primary,
  `DATABASE_REPLICA_URL` to the regional reader. The app's
  `src/server/db/replica.ts` routes reads transparently.
- **R2** (Cloudflare) is globally replicated with no egress fees — single
  bucket serves all regions.
- **Meilisearch** runs as a single primary; in scale-up phase swap for
  Meilisearch Cloud HA cluster.
- **Cloudflare**: WAF rules block `cf-bot-bad`, `cf-torrent`, scraper UAs;
  rate-limit unauthenticated `/api/v1/*` at 60 req/min/IP; image transform
  rules for `next/image`.

## Provisioning matrix

| Component | Provider | IaC entry | Cost note |
|-----------|----------|-----------|-----------|
| Web (Next.js) | Vercel (default) or AWS ECS | `terraform/aws/web.tf` | Vercel Pro: $20/seat |
| API (route handlers) | Same as web | — | — |
| DB | RDS Aurora Postgres 16 + PostGIS | `terraform/aws/db.tf` | r6g.large + reader |
| Cache | ElastiCache Redis 7 | `terraform/aws/cache.tf` | cache.t4g.small × 2 |
| Search | Meilisearch on ECS Fargate (Spot) | `terraform/aws/search.tf` | $30/mo |
| Object storage | Cloudflare R2 | `terraform/cloudflare/r2.tf` | 0¢ egress |
| Edge | Cloudflare | `terraform/cloudflare/zone.tf` | Free–Pro |
| Logs | Better Stack | external | $5/mo |
| Errors | Sentry | external | $26/mo |
| Analytics | PostHog Cloud | external | scaled |

## Deployment runbook

1. `terraform init && terraform plan -out=plan` in the relevant region.
2. `terraform apply plan`. Wait ~12 minutes for Aurora cluster.
3. Set GitHub Actions secrets: `DATABASE_URL`, `DATABASE_REPLICA_URL`,
   `REDIS_URL`, `MEILISEARCH_HOST`, `MEILISEARCH_MASTER_KEY`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
   `CLERK_*`, `ANTHROPIC_API_KEY`, `OPENWEATHER_API_KEY`,
   `STRIPE_SECRET_KEY` / `IYZICO_*`.
4. Tag a release: `git tag v0.x.0 && git push --tags`. The
   `.github/workflows/release.yml` workflow runs migrations and deploys.
5. Monitor `/healthz` and `/readyz` until 200 OK; check
   `replicaLagMs < 1000` in `/readyz` body.
6. Cut DNS over to the new region in Cloudflare.

## Chaos engineering

A monthly chaos game day exercises:

- DB: kill primary, expect failover within 30s; reads via replica continue.
- Cache: flush Redis; expect graceful degradation (in-memory rate-limit
  fallback already in code).
- Search: shut down Meili; expect the DB-fallback search provider to take over.
- AI: revoke Anthropic key; expect chat to fall back to mock provider.
- All four together: declare a P1, follow `runbooks/incident.md`.

See `runbooks/chaos.md` for the detailed playbook.

## SLOs

| Service | SLI | SLO | Burn alert |
|---------|-----|-----|------------|
| Web LCP | LCP p75 | < 2.5s on 4G | 14d burn rate × 14.4 |
| Public API | request success | 99.9% | 1h burn rate × 14.4 |
| Public API latency | p95 | < 300ms cached / < 800ms uncached | 24h burn × 6 |
| Concierge | first token p95 | < 1.5s | 24h burn × 6 |
| Auth | sign-in success | 99.95% | 1h burn × 14.4 |

Error budgets are tracked weekly in PostHog; burn alerts route to
`#oncall` Slack via Better Stack.
