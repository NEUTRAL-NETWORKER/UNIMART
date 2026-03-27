@echo off
title UNIMART - Backend Server
color 0A

cd /d "%~dp0backend"

echo ============================================
echo   UNIMART BACKEND SERVER
echo ============================================
echo.

:: Activate venv or create it
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo Virtual environment activated
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
)

echo.
echo Installing/updating dependencies...
pip install -r requirements.txt -q

echo.
echo ============================================
echo   Starting FastAPI Server
echo   URL: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Admin credentials: backend\.env (ADMIN_USERNAME / ADMIN_PASSWORD)
echo ============================================
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
