# Incident Runbook

When a Sentry alert, Better Stack uptime alert, or a customer report indicates
a P0/P1 incident, follow this runbook.

## Severity definitions

| Sev | Definition | Response time |
|-----|------------|---------------|
| P0  | Total outage; payments broken; data loss | 5 min |
| P1  | Major feature broken; > 10% users impacted | 15 min |
| P2  | Single-feature degradation; < 10% impact | 1h |
| P3  | Cosmetic or single-user | Next business day |

## Initial response (first 5 minutes)

1. **Declare** the incident in `#incidents` with severity, headline,
   and a link to the trigger (Sentry/Better Stack/customer ticket).
2. **Acknowledge** the page; assign Incident Commander (IC) and
   Communications Lead (Comms).
3. **Status page**: Comms updates `status.turkiye-tourism.app` with
   "Investigating", components affected.
4. **Snapshot** state: take a Cloudflare audit log dump,
   `kubectl/ECS describe` the affected service, screenshot Sentry breadcrumbs.

## Diagnosis ladder

For P0/P1 outages, check in this order before any change:

1. **Cloudflare** WAF / rate-limit / DDoS — block storms first.
2. **Database** primary writes ok? `SELECT 1` from the primary, then
   the replica. If replica lag > 60s, fail over.
3. **Cache** Redis up? If Redis is down, the app falls back to in-memory
   rate limit — service continues but with worse limits. No action.
4. **Search** Meilisearch up? If down, DB-fallback provider auto-engages.
5. **Auth** Clerk up? If down, switch `AUTH_PROVIDER=mock` only as last
   resort; mock provider does not validate Clerk webhooks.
6. **AI** Anthropic up? If down, mock provider auto-engages; concierge
   degrades gracefully.

## Common P1 fixes

### Database failover

```
aws rds failover-db-cluster --db-cluster-identifier turkiye-prod-aurora
```

Replica becomes primary in ~30s. Update Doppler `DATABASE_URL` and trigger
deployment.

### Cloudflare emergency block

Add IP/UA/path to Cloudflare WAF custom rules. Effective in < 30s globally.

### Rollback

```
git revert HEAD~N && git push      # then tag v0.x.y-rollback
```

Last 5 deploys are also rollback-able from the Vercel dashboard in 1 click.

## Postmortem

Within 5 business days of resolution:

1. Document timeline (alert → ack → mitigation → resolution).
2. Identify root cause (5 whys).
3. Action items with owners.
4. File `postmortems/YYYY-MM-DD-<slug>.md` in this directory.
