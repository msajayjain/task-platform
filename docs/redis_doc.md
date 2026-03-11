# Redis Runtime Behavior and Troubleshooting

## Why app works but terminal shows Redis error

Your API logs Redis errors from `apps/api/src/infrastructure/cache/redis.ts`:

- It creates a Redis client using `REDIS_URL`.
- On connection failure, it logs: **"Redis connection error"**.

In `apps/api/src/presentation/middlewares/rate-limit.middleware.ts`, Redis failures are intentionally handled in fallback mode:

- If Redis fails or times out, middleware logs a warning.
- The request is still allowed to continue (rate limiting is bypassed).

Because of this design, the app can continue running even when Redis is unavailable.

---

## What is affected when Redis is down

- Rate limiting may be skipped (fallback path).
- Queue/worker features (BullMQ jobs) may not run correctly if enabled.
- Core API/UI can still appear to work normally.

---

## How to resolve

1. Ensure Redis server is running on the URL in `.env` (`REDIS_URL`).
2. Verify connectivity:
   - Run `redis-cli ping` (expected: `PONG`), or
   - Run Redis via Docker container.
3. If using Docker mode, ensure app points to container Redis host (`redis:6379`) via Docker env overrides.
4. Restart API after Redis is fixed.

---

## Quick check examples

- Local mode typical value:
  - `REDIS_URL=redis://localhost:6379`
- Docker container network typical value:
  - `REDIS_URL=redis://redis:6379`
