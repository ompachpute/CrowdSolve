@echo off
chcp 65001 >nul
echo ==========================================
echo   CrowdSolve Portal - Starting All Services
echo ==========================================
echo.

set PROJECT_ROOT=%~dp0
set DOCKER="C:\Program Files\Docker\Docker\resources\bin\docker.exe"

echo [1/4] Starting PostgreSQL...
cd /d "%PROJECT_ROOT%"
%DOCKER% compose up -d
echo.

echo [2/4] Starting Backend...
start "CrowdSolve Backend" cmd /c "cd /d '%PROJECT_ROOT%backend' && mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [3/4] Starting AI Service...
start "CrowdSolve AI Service" cmd /c "cd /d '%PROJECT_ROOT%ai-service' && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 2 /nobreak >nul

echo [4/4] Starting Frontend...
start "CrowdSolve Frontend" cmd /c "cd /d '%PROJECT_ROOT%frontend' && npm start"

echo.
echo ==========================================
echo   All services starting...
echo ==========================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8080
echo   AI:        http://localhost:8000
echo.
echo   Demo accounts:
echo     Citizen:    citizen@gmail.com / password
echo     Team:       team@gmail.com / password
echo     Industry:   org@gmail.com / password
echo     Government: gover@gmail.com / password
echo.
pause
