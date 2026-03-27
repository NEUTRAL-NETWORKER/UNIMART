# UNIMART // DIGITAL MARKET GRID

![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-06b6d4?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-10b981?style=for-the-badge&logo=fastapi)
![Data](https://img.shields.io/badge/Data-PostgreSQL%20%2B%20Redis-334155?style=for-the-badge&logo=postgresql)
![Auth](https://img.shields.io/badge/Auth-JWT%20Access%20%2B%20Refresh-0ea5e9?style=for-the-badge)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-111827?style=for-the-badge&logo=githubactions)

UNIMART is a verified student-to-student marketplace with private order chat, OTP-based handoff completion, in-app notifications, and a DB-backed admin panel.

## 01. System Snapshot

- Frontend: React 18, Vite 5, React Router, Axios, Tailwind, Framer Motion.
- Backend: FastAPI, SQLAlchemy, Alembic, JWT auth, APScheduler.
- Data and services: PostgreSQL, Redis, SMTP, Cloudinary.
- API base path: /api.
- Health endpoint: /api/health.

## 02. Architecture Pulse

```text
Browser (React + Vite)
        |
        | HTTPS / JSON
        v
FastAPI app (backend/main.py)
  |- /auth, /products, /orders, /chat
  |- /otp, /notifications, /upload, /admin
  |
  |- PostgreSQL (core transactional data)
  |- Redis (registration OTP + delivery OTP + attempt counters)
  |- SMTP (registration and delivery emails)
  |- Cloudinary (product image storage)

Scheduler process (backend/run_scheduler.py)
  |- cleanup sold-out products (24h interval)
  |- cleanup completed-order chats (1h interval)
```

## 03. Feature Surface

| Module | Capabilities | Main Paths |
|---|---|---|
| Authentication | register/login/profile, refresh token | /api/auth/* |
| Products | list/search/create/update/delete/my items | /api/products/* |
| Orders | place, buyer list, seller list, confirm, cancel | /api/orders/* |
| Chat | order-scoped private messaging | /api/chat/{order_id} |
| OTP Handoff | generate, send-email, verify completion | /api/otp/* |
| Notifications | feed, unread count, mark read, delete | /api/notifications/* |
| Upload | single and multi-image upload | /api/upload/image, /api/upload/images |
| Admin | login, stats, moderation, audit logs | /api/admin/* |

## 04. Repository Layout

```text
.
|- backend/
|  |- routers/
|  |- middleware/
|  |- services/
|  |- alembic/
|  |- main.py
|  |- models.py
|  |- schemas.py
|  |- settings.py
|  |- run_scheduler.py
|  |- requirements.txt
|  \- .env.example
|- frontend/
|  |- src/
|  |  |- admin/
|  |  |- components/
|  |  |- context/
|  |  |- pages/
|  |  |- routes/
|  |  \- services/
|  |- package.json
|  \- .env.example
|- DEPLOYMENT_CHECKLIST.md
|- PROJECT_AUDIT_REPORT.md
|- run_commands.txt
|- start.bat
|- start-backend.bat
|- start-frontend.bat
\- start-simple.bat
```

## 05. Local Boot Sequence

### Prerequisites

- Python 3.10+
- Node.js 18+ (CI uses Node 20)
- PostgreSQL 14+
- Redis 7+

### Backend (terminal 1)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (terminal 2)

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Set in frontend/.env.local:

```env
VITE_API_URL=http://localhost:8000/api
```

### One-click launcher options (Windows)

- start.bat
- start-simple.bat
- start-backend.bat
- start-frontend.bat

## 06. Environment Contract

### Backend variables (production critical)

- DATABASE_URL
- REDIS_URL
- SECRET_KEY (strong, non-placeholder)
- REFRESH_TOKEN_SECRET (strong, non-placeholder)
- ADMIN_JWT_SECRET (strong, non-placeholder)
- ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME
- SMTP_SERVER, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- APP_ENV=production
- ENABLE_SCHEDULER=false on API workers
- CORS_ORIGINS set to deployed frontend domains

### Frontend variables

- VITE_API_URL (must target backend /api base)
- VITE_APP_BASENAME (`/` for root hosting, repository name for GitHub Pages)

## 07. API Map

| Domain | Prefix | Selected Endpoints |
|---|---|---|
| Auth | /api/auth | verify/{register_number}, send-registration-otp, verify-registration-otp, register, login, refresh, profile |
| Products | /api/products | /, /my, /search, /{product_id} |
| Orders | /api/orders | /, /buyer, /seller, /{id}, /{id}/status, /{id}/cancel |
| Chat | /api/chat | /{order_id} (GET, POST) |
| OTP | /api/otp | /generate, /send-email, /verify |
| Notifications | /api/notifications | /, /unread-count, /read-all, /{id}/read, /{id} |
| Upload | /api/upload | /image, /images |
| Admin | /api/admin | /auth/login, /dashboard/stats, /users, /products, /orders, /audit-logs |

## 08. Order + OTP State Machine

```text
PENDING --seller confirms--> CONFIRMED --OTP verify--> COMPLETED
PENDING -------------------> CANCELLED
CONFIRMED -----------------> CANCELLED
```

Rules enforced by backend:

- Only seller can move PENDING -> CONFIRMED.
- COMPLETED cannot be set directly via order status endpoint.
- OTP verify endpoint is required for completion.
- Product transitions follow order lifecycle: AVAILABLE -> RESERVED -> SOLD_OUT (or back to AVAILABLE on cancel).

## 09. Scheduler and Data Retention

- Job 1 (24h): soft-delete SOLD_OUT products older than 7 days by setting DELETED.
- Job 2 (1h): delete chat messages for COMPLETED orders older than 24 hours.
- Recommended production model:
  - API workers with ENABLE_SCHEDULER=false
  - one dedicated scheduler process via python run_scheduler.py

## 10. CI and Quality Gates

GitHub Actions workflow (.github/workflows/ci.yml) runs:

- Frontend job: npm ci + npm run build
- Backend job: pip install -r requirements.txt + python -m compileall . + import smoke check

GitHub deployment workflow (.github/workflows/deploy.yml) runs on `main`:

- Builds and publishes backend image to GHCR (`ghcr.io/<owner>/unimart-backend`)
- Deploys frontend to GitHub Pages
- Optionally triggers backend platform deploy hook if configured

Current CI does not run full unit/integration tests.

## 11. Deployment

Use DEPLOYMENT_CHECKLIST.md as the release gate.

Minimum GitHub release flow:

1. Recommended: set repository variable or secret `FRONTEND_VITE_API_URL=https://<backend-domain>/api`.
2. Optional: set repository variable `ENABLE_BACKEND_IMAGE_PUBLISH=true` to publish backend image to GHCR.
3. Optional: configure secret `BACKEND_DEPLOY_HOOK_URL` for Render/Railway/Fly deploy webhook.
4. Push to `main` (or run workflow dispatch for `.github/workflows/deploy.yml`).
5. Apply migrations on backend target: `alembic upgrade head`.
6. Validate health endpoint and login flow.
7. Start only one scheduler process.
8. Run post-deploy smoke checks for orders, OTP, and notifications.

Local/manual release flow:

1. Apply migrations: alembic upgrade head.
2. Validate health endpoint and login flow.
3. Start only one scheduler process.
4. Run post-deploy smoke checks for orders, OTP, and notifications.

## 12. Troubleshooting Grid

| Symptom | Likely Cause | Quick Action |
|---|---|---|
| 401 loops | expired access + invalid refresh token | clear local storage, login again, verify REFRESH_TOKEN_SECRET |
| OTP generate/verify fails | Redis down or key expired | verify REDIS_URL service and retry generate |
| Image upload fails | Cloudinary creds missing/invalid | validate CLOUDINARY_* values |
| CORS blocked in browser | bad or empty CORS_ORIGINS in prod | set exact frontend domains |
| Registration OTP email fails | SMTP auth/port/provider issue | verify SMTP config and sender policy |

## 13. Security Notes

- Production startup enforces strong secrets through backend/settings.py checks.
- Keep JWT secrets and SMTP credentials out of source control.
- Restrict CORS to known domains only.
- Prefer HTTPS termination at ingress/load balancer.

## 14. License

This project is licensed under the Apache License 2.0.
