@echo off
setlocal EnableDelayedExpansion
title UNIMART - System Launcher
color 0A

echo.
echo ================================================================
echo                    UNIMART SYSTEM LAUNCHER
echo           Student-to-Student Marketplace Platform
echo ================================================================
echo.

:: Check if we're in the right directory
cd /d "%~dp0"

echo [STEP 1] Checking system requirements...
echo ----------------------------------------------------------------

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)
echo [OK] Python is installed

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)
echo [OK] Node.js is installed

echo.
echo [STEP 2] Checking required services...
echo ----------------------------------------------------------------

:: Check PostgreSQL
netstat -an | find "5432" | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL may not be running on port 5432
) else (
    echo [OK] PostgreSQL is running
)

:: Check Redis
netstat -an | find "6379" | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Redis may not be running on port 6379
) else (
    echo [OK] Redis is running
)

echo.
echo [STEP 3] Starting services...
echo ----------------------------------------------------------------

:: Start Backend
echo Starting Backend Server...
start "UNIMART BACKEND" cmd /k "cd /d "%~dp0backend" && if not exist venv (python -m venv venv) && call venv\Scripts\activate.bat && pip install -r requirements.txt -q && echo. && echo ============================================ && echo   BACKEND RUNNING on http://localhost:8000 && echo   API Docs: http://localhost:8000/docs && echo ============================================ && echo. && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Start Frontend
echo Starting Frontend Server...
start "UNIMART FRONTEND" cmd /k "cd /d "%~dp0frontend" && npm install && echo. && echo ============================================ && echo   FRONTEND RUNNING on http://localhost:5173 && echo   Admin Panel: http://localhost:5173/admin/login && echo ============================================ && echo. && npm run dev"

echo.
echo ================================================================
echo                   STARTUP COMPLETE
echo ================================================================
echo.
echo   Frontend:    http://localhost:5173
echo   User Login:  http://localhost:5173/login
echo   Admin Panel: http://localhost:5173/admin/login
echo   Backend API: http://localhost:8000
echo   API Docs:    http://localhost:8000/docs
echo.
echo   Admin credentials are loaded from backend\.env
echo   (ADMIN_USERNAME / ADMIN_PASSWORD)
echo.
echo   Two new windows opened:
echo   - UNIMART BACKEND (FastAPI server)
echo   - UNIMART FRONTEND (Vite dev server)
echo.
echo   Press any key to close this launcher window...
echo   (The servers will continue running in their windows)
echo ================================================================
pause >nul
