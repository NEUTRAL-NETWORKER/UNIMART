# UNIMART Local Development Guide

Use this guide to run UNIMART locally from the repository root.

## Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn main:app --reload --port 8000
```

Backend URLs:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Frontend Setup

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend URLs:

- App: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

Set this variable in frontend/.env.local:

```env
VITE_API_URL=http://localhost:8000/api
```

## Quick Start (Two Terminals)

Terminal 1:

```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

## Optional Scheduler Process

Run only one scheduler instance:

```powershell
cd backend
venv\Scripts\activate
python run_scheduler.py
```

## Notes

- Ensure backend/.env and frontend/.env.local are configured.
- Redis and PostgreSQL must be running for OTP and order lifecycle features.
- Keep a single scheduler instance running at any time.
- Keep official records CSV private and local. Configure `OFFICIAL_RECORDS_CSV` in backend `.env` (default: `official_data.csv`).
- Copy `backend/official_data.template.csv` to a private file (for example `backend/official_data.csv`) and populate real records locally.