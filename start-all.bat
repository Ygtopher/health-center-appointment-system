@echo off
echo ========================================
echo Health Center System - Starting...
echo ========================================
echo.

echo Checking prerequisites...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

if not exist frontend\node_modules (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo Starting Backend Server (Terminal 1)
echo ========================================
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Starting Frontend Server (Terminal 2)
echo ========================================
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul

