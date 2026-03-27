@echo off
title UNIMART - Quick Start
color 0A

echo Starting UNIMART System...
echo.

cd /d "%~dp0"

:: Start Backend
echo [1/2] Starting Backend...
start "UNIMART BACKEND" cmd /k "cd backend && call venv\Scripts\activate.bat 2>nul || python -m venv venv && call venv\Scripts\activate.bat && pip install -r requirements.txt -q && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait a bit
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend...
start "UNIMART FRONTEND" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo UNIMART is starting...
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/admin/login
echo.
echo Admin credentials: backend\.env (ADMIN_USERNAME / ADMIN_PASSWORD)
echo.
pause
