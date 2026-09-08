@echo off
chcp 65001 >nul
echo ==========================================
echo   CrowdSolve Portal - Quick Start
echo ==========================================
echo.

echo [Step 1/4] Starting PostgreSQL...
cd /d "%~dp0"
docker compose up -d
echo.

echo [Step 2/4] Installing AI service dependencies...
cd /d "%~dp0ai-service"
pip install -r requirements.txt >nul 2>&1
echo   AI dependencies installed
echo.

echo [Step 3/4] Starting Backend (Spring Boot)...
echo   IMPORTANT: Open a NEW PowerShell window and run:
echo   cd "%~dp0backend"
echo   mvn spring-boot:run
echo.
echo [Step 4/4] Starting Frontend (React)...
echo   IMPORTANT: Open another NEW PowerShell window and run:
echo   cd "%~dp0frontend"
echo   npm start
echo.
echo ==========================================
echo   Services will be available at:
echo   - Backend:  http://localhost:8080
echo   - AI:       http://localhost:8000
echo   - Frontend: http://localhost:3000
echo ==========================================
echo.
echo Demo accounts:
echo   Citizen:    citizen@gmail.com / password
echo   Team:       team@gmail.com / password
echo   Industry:   org@gmail.com / password
echo   Government: gover@gmail.com / password
echo.
pause
