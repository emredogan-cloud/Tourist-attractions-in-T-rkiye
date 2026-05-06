# Chaos Engineering Game Day

Run on the first Wednesday of each month, 10:00 Istanbul time. Two engineers:
one Operator (drives faults), one Observer (records timeline + measures impact).

## Prep (T-24h)

- Announce in `#engineering` so no one cuts a release window during the test.
- Verify staging mirrors production topology (read replica, Redis, Meili).
- Snapshot `pgbench` baseline against staging.

## Scenarios

Run one scenario per game day. Rotate the roster.

### S1 — Aurora primary kill

**Hypothesis:** Failover completes in < 30s; reads continue uninterrupted via
replica; writes resume after the cluster promotes the new primary; the
`/readyz` endpoint reports `db: false → true` cleanly.

**Procedure:**
1. `aws rds reboot-db-instance --db-instance-identifier turkiye-prod-aurora-1 --force-failover`.
2. Watch Sentry, Better Stack, and `/healthz` from a tail dashboard.
3. Record:
   - Time-to-detect (TTD) — first 5xx burst.
   - Time-to-recover (TTR) — last 5xx + first 200 stable.
   - User-visible impact: how many requests failed, what error messages.

**Pass criteria:** TTR < 60s; no data loss in `Subscription` or `Review`
tables; queue jobs auto-retry; no orphan rows.

### S2 — Redis flush

**Hypothesis:** Rate-limit falls back to in-memory; sessions cached in Redis
re-validate from DB; SSE streams reconnect.

**Procedure:**
1. `redis-cli -h prod-redis FLUSHALL`.
2. Watch `/api/v1/*` 429 rate; should not spike.

### S3 — Meilisearch outage

**Hypothesis:** Search auto-degrades to DB provider; latency rises but
results stay relevant.

**Procedure:**
1. `aws ecs update-service --service meili --desired-count 0`.
2. Hit `/api/v1/search?q=ayasofya` — should still return Hagia Sophia.
3. Restore service after 2 minutes.

### S4 — Anthropic outage

**Hypothesis:** Concierge auto-engages MockAIProvider; users still get
deterministic itinerary drafts. Premium budget metering unaffected.

**Procedure:**
1. Set `AI_PROVIDER=mock` via Doppler env override.
2. Validate concierge still streams; check ConciergeMessage rows still
   persist correctly.

### S5 — Cascade

Run S1 + S2 + S3 + S4 simultaneously. Pass criteria: site stays up with
reduced functionality but no full outage.

## Report

Append findings to `chaos-history.md` in this directory:

```
| Date | Scenario | TTD | TTR | Pass | Notes |
|------|----------|-----|-----|------|-------|
| 2026-06-03 | S1 | 8s | 38s | ✅ | clean failover; replica lag stayed < 200ms |
```
