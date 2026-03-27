@echo off
title UNIMART - Frontend Server
color 0A

cd /d "%~dp0frontend"

echo ============================================
echo   UNIMART FRONTEND SERVER
echo ============================================
echo.

echo Installing dependencies...
call npm install

echo.
echo ============================================
echo   Starting Vite Dev Server
echo   URL: http://localhost:5173
echo   Admin Panel: http://localhost:5173/admin/login
echo   User Login: http://localhost:5173/login
echo ============================================
echo.

npm run dev
