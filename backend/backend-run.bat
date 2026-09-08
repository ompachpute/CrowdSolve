@echo off
chcp 65001 >nul
cd /d "C:\Users\Om Pachpute\OneDrive\Desktop\Prototype 2.0\backend"
echo [%date% %time%] Starting mvn spring-boot:run > backend-run.log
call mvn spring-boot:run >> backend-run.log 2>&1
echo [%date% %time%] mvn exited with code %errorlevel% >> backend-run.log