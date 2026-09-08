@echo off
chcp 65001 >nul
cd /d "C:\Users\Om Pachpute\OneDrive\Desktop\Prototype 2.0\frontend"
echo [%date% %time%] Starting npm start > frontend-run.log
call npm start >> frontend-run.log 2>&1
echo [%date% %time%] npm exited with code %errorlevel% >> frontend-run.log