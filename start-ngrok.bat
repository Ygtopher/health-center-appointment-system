@echo off
echo ========================================
echo Health Center System - ngrok Tunnel
echo ========================================
echo.
echo Starting ngrok tunnel to expose http://localhost:3000
echo Make sure ngrok is installed and authenticated first.
echo.

ngrok http 3000

echo.
echo ngrok tunnel stopped.
pause

