# UNIMART Deployment Checklist

Use this document as the mandatory go/no-go gate for every production release.

Release metadata:

- Date:
- Release tag / commit:
- Owner:
- Approver:
- Rollback owner:

## 01. Preflight

- [ ] Branch is up to date with target branch.
- [ ] Pull request is reviewed and merged policy is satisfied.
- [ ] GitHub Actions CI is green for latest commit.
- [ ] No local-only files are committed (.env, node_modules, venv, dist, cache files).
- [ ] Database backup snapshot has been taken.
- [ ] Rollback package (previous stable image/build) is available.

## 02. Infrastructure Readiness

- [ ] PostgreSQL is reachable and healthy.
- [ ] Redis is reachable and healthy.
- [ ] SMTP provider credentials are valid.
- [ ] Cloudinary credentials are valid.
- [ ] TLS/HTTPS termination is active at edge.

## 03. Environment Configuration

### Backend required

- [ ] APP_ENV=production
- [ ] DATABASE_URL points to production database
- [ ] REDIS_URL points to production Redis
- [ ] SECRET_KEY is strong and non-placeholder (32+ chars)
- [ ] REFRESH_TOKEN_SECRET is strong and non-placeholder (32+ chars)
- [ ] ADMIN_JWT_SECRET is strong and non-placeholder (32+ chars)
- [ ] ADMIN_USERNAME and ADMIN_PASSWORD set
- [ ] ADMIN_DISPLAY_NAME set
- [ ] SMTP_SERVER set
- [ ] SMTP_PORT set
- [ ] SMTP_EMAIL set
- [ ] SMTP_PASSWORD set
- [ ] CLOUDINARY_CLOUD_NAME set
- [ ] CLOUDINARY_API_KEY set
- [ ] CLOUDINARY_API_SECRET set
- [ ] CORS_ORIGINS set to exact production frontend origins
- [ ] ENABLE_SCHEDULER=false on API workers

### Frontend required

- [ ] VITE_API_URL points to public backend API base and ends with /api

## 04. Database and Schema

- [ ] Alembic migration scripts present and reviewed.
- [ ] Migration command prepared:

```bash
alembic upgrade head
```

- [ ] Critical tables verified after migration:
  - official_records
  - user_profiles
  - products
  - orders
  - chat_messages
  - notifications
  - admin_accounts
  - admin_audit_logs

- [ ] Startup seeding behavior verified:
  - official records seed check
  - super-admin seed/check

## 05. Process Model

- [ ] API processes configured (example: uvicorn main:app --workers 4).
- [ ] Exactly one dedicated scheduler process is configured:

```bash
python run_scheduler.py
```

- [ ] Confirm there is not more than one scheduler instance.

## 06. Deploy Execution

- [ ] Put system in maintenance/low-traffic deployment window (if required).
- [ ] Deploy backend artifact.
- [ ] Run alembic upgrade head.
- [ ] Start/restart backend workers.
- [ ] Start/restart scheduler process.
- [ ] Deploy frontend artifact.
- [ ] Purge CDN/cache layer if used.

## 07. Post-Deploy Smoke Checks

### Core service checks

- [ ] GET /api/health returns healthy.
- [ ] GET /docs is accessible for internal diagnostics.
- [ ] Frontend loads without console-breaking errors.

### Auth checks

- [ ] User login works.
- [ ] Refresh token flow works (401 triggers refresh path).
- [ ] Profile endpoint works.
- [ ] Admin login works.

### Product and order checks

- [ ] Product list/search works.
- [ ] Product create and update works.
- [ ] Order place works.
- [ ] Seller confirm works.
- [ ] Cancel flow works from allowed states.

### OTP and chat checks

- [ ] Chat works for buyer/seller participants only.
- [ ] OTP generate works (seller only, CONFIRMED order).
- [ ] OTP send-email works.
- [ ] OTP verify completes order and marks product SOLD_OUT.

### Notification and admin checks

- [ ] Notification list and unread count endpoints work.
- [ ] Mark read/read-all/delete operations work.
- [ ] Admin dashboard stats load correctly.

## 08. Security and Observability

- [ ] No placeholder secrets are present in runtime env.
- [ ] CORS allows only expected domains.
- [ ] Access and error logs are centralized.
- [ ] Alerts configured for:
  - high API 5xx rates
  - Redis connection failures
  - scheduler process failure
  - SMTP send failures

## 09. Rollback Readiness

- [ ] Rollback command sequence documented.
- [ ] Backward-compatibility of schema verified (or rollback migration plan prepared).
- [ ] Team communication path ready if rollback required.
- [ ] On-call owner confirmed for the deployment window.

## 10. Minimal Test Plan (Release Gate)

Run these minimum tests on staging or immediately after production deployment:

- [ ] Auth test: login, refresh token renewal, profile fetch.
- [ ] Product test: create product, list product, update product, delete guard behavior.
- [ ] Order test: place order, seller confirm, cancel from valid status.
- [ ] OTP test: generate, send-email, verify 6-digit OTP, confirm COMPLETED state.
- [ ] Chat test: buyer/seller can send on active orders, blocked on COMPLETED/CANCELLED.
- [ ] Notification test: unread count increments, mark-read and read-all behavior.
- [ ] Admin test: admin login, dashboard stats, one moderation action.

## 11. Final Sign-Off

- [ ] Engineering sign-off
- [ ] Product sign-off
- [ ] Operations sign-off

Deployment result:

- [ ] GO
- [ ] NO-GO

Notes:

-