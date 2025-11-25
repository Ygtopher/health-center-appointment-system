@echo off
echo Starting Frontend Server...
echo.
cd /d "%~dp0\frontend"
npm run dev
pause

