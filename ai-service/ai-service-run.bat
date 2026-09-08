@echo off
chcp 65001 >nul
cd /d "C:\Users\Om Pachpute\OneDrive\Desktop\Prototype 2.0\ai-service"
echo [%date% %time%] Starting uvicorn > ai-service-run.log
call python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> ai-service-run.log 2>&1
echo [%date% %time%] uvicorn exited with code %errorlevel% >> ai-service-run.log