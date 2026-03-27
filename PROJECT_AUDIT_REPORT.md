# UNIMART Project Audit Report

Audit date: 2026-03-27

Scope:

- Full-stack code review of frontend, backend, ops scripts, and CI workflow.
- Verification of API surface against router definitions.
- Deployment readiness and risk posture assessment.

## 01. Executive Scorecard

| Area | Status | Notes |
|---|---|---|
| Architecture coherence | Good | Clear modular split across auth, products, orders, chat, otp, notifications, admin |
| API connectivity | Good | Frontend services map to backend router endpoints under /api |
| Security baseline | Fair | Secret enforcement in production exists; still depends on environment hygiene |
| Deployment process | Good | Checklist, startup scripts, scheduler split model, CI build/smoke checks |
| Test depth | Needs improvement | CI compiles/builds and import-smokes, but no broad automated test suite |
| Release readiness | Good with conditions | Ready for controlled release with checklist and manual smoke validation |

## 02. Architecture Verification

### Frontend

- React + Vite SPA with route segmentation for user and admin experiences.
- Context layers in use: Auth, Theme, Order, Chat, Notification.
- API client includes:
  - bearer token attachment
  - refresh-token retry path on 401
  - controlled redirects for auth failures

### Backend

- FastAPI app mounts routers under /api:
  - /auth
  - /products
  - /orders
  - /chat
  - /otp
  - /notifications
  - /upload
  - /admin
- Health endpoint and lightweight stats endpoint are available.
- Production mode enforces non-placeholder strong secret values.

### Data and Integrations

- PostgreSQL for domain data.
- Redis for OTP data and attempt counters.
- SMTP for registration and OTP delivery notifications.
- Cloudinary for image uploads.
- APScheduler for lifecycle cleanup jobs.

## 03. Domain Flow Audit

### Identity and Session

- Register and login return access token and optional refresh token.
- /auth/refresh endpoint provides token renewal path.
- Client persists token, refresh token, and user object in local storage.

### Product to Order to OTP completion

- Product must be AVAILABLE for order creation.
- Order creation transitions product to RESERVED.
- Seller confirms order via status endpoint (PENDING -> CONFIRMED).
- Completion cannot be set directly through order status endpoint.
- Completion is executed only through OTP verify endpoint.
- OTP verification transitions order to COMPLETED and product to SOLD_OUT.

### Chat lifecycle

- Chat is private to buyer/seller participants of each order.
- Send operations are gated by order status.
- Completed and cancelled orders are read-only for messaging.

### Notifications

- Notification creation is integrated with order and OTP events.
- User can list, mark read, mark all read, count unread, and delete.

### Admin control plane

- Separate admin auth and token flow.
- Dashboard stats, user moderation, product moderation, order override, and audit logs are implemented.

## 04. CI/CD and Operations Audit

### CI workflow coverage

Current workflow verifies:

- frontend dependency install and production build
- backend dependency install
- backend compile-all pass
- backend import smoke check

Current workflow does not verify:

- backend API integration tests
- frontend component/unit tests
- end-to-end user flows

### Runtime process model

- API process can run scheduler if ENABLE_SCHEDULER=true.
- Dedicated scheduler process exists via run_scheduler.py.
- Recommended production setup is API workers plus exactly one dedicated scheduler process.

## 05. Security Posture

Strengths:

- Production secret validation in settings.
- CORS policy requires explicit origins in production mode.
- OTP attempt limiting and expiry are enforced in Redis.

Risks to monitor:

- If runtime env values are weak, auth guarantees degrade despite guardrails.
- Redis outages directly impact OTP and related transactional completion flow.
- SMTP failures can block OTP email delivery despite API availability.

## 06. Key Findings

### High priority

1. Automated testing gap
- Finding: no substantial unit/integration/e2e coverage in CI.
- Impact: regressions can pass build-smoke checks unnoticed.
- Recommendation: add backend pytest API tests and frontend Vitest/RTL tests for auth/order/otp critical paths.

### Medium priority

2. Duplicate order cancellation paths
- Finding: both PUT /orders/{id}/status with CANCELLED and POST /orders/{id}/cancel are present.
- Impact: contract duplication increases client complexity and maintenance risk.
- Recommendation: standardize on one canonical cancellation path and deprecate the other with transition plan.

3. Legacy order OTP column remains in data model
- Finding: order model still has otp_code while active flow stores OTP in Redis.
- Impact: model ambiguity for future contributors.
- Recommendation: mark field as deprecated in model comments or remove via migration after confirming no dependency.

4. run_commands paths target project folder naming
- Finding: manual command doc uses absolute paths under project.
- Impact: confusion when operating from mirrored folder copies.
- Recommendation: convert run_commands to relative-path instructions.

### Low priority

5. Operational observability can be expanded
- Finding: logging exists but dashboard/alerts are not defined in repository docs.
- Impact: slower incident response.
- Recommendation: document expected alert thresholds and log aggregation target.

## 07. Release Readiness Assessment

Overall readiness: Good with conditions

Release can proceed if all conditions are met:

1. Deployment checklist is fully executed.
2. Post-deploy smoke tests pass (auth, product, order, otp, notifications, admin).
3. Scheduler single-instance guarantee is confirmed.
4. Secrets and CORS configuration are verified in production runtime.

## 08. 30-Day Action Plan

1. Add backend API integration tests for auth/order/otp transitions.
2. Add frontend tests for AuthContext refresh and order action flows.
3. Consolidate cancellation endpoint contract.
4. Clarify or remove deprecated otp_code model field.
5. Add runbook for Redis/SMTP incident handling and alerting.

## 09. Minimal Test Plan (Recommended Baseline)

To reduce regression risk, this baseline suite should be executed per release:

1. Auth flow: register/login, refresh token exchange, profile read/update.
2. Product flow: create/list/search/update/delete with ownership checks.
3. Order flow: create order, seller confirm, cancel path validation.
4. OTP flow: generate/send/verify with invalid-attempt handling and expiry handling.
5. Chat flow: participant authorization and lifecycle gating by order status.
6. Notification flow: list, unread-count, mark-read, mark-all-read, delete.
7. Admin flow: login, dashboard stats, user or product moderation action.
8. Scheduler flow: sold-out product cleanup and completed-order chat cleanup jobs.

## 10. Conclusion

UNIMART is architecturally solid and functionally coherent for student marketplace operations. Core transactional paths are implemented with practical guardrails and sensible process separation. The main maturity gap is automated test depth rather than feature completeness. With checklist-driven deployment discipline and targeted reliability improvements, the system is suitable for production rollout.