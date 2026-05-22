@echo off
title Admin Panel – Luu Ly Hien Nhi Cac
cd /d "%~dp0"

echo.
echo  =========================================
echo    ADMIN PANEL - Luu Ly Hien Nhi Cac
echo  =========================================
echo.
echo  Khoi dong server tai: http://localhost:3344
echo  Nhan Ctrl+C de dung server
echo.

:: Mo trinh duyet sau 1.5 giay
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3344"

:: Khoi dong Node server
node admin-server.js

pause
