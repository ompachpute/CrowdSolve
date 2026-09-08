@echo off
chcp 65001 >nul
echo ==========================================
echo   CrowdSolve Portal - Setup Verification
echo ==========================================
echo.

echo [1/6] Checking Java...
java -version 2>&1 | findstr "version" >nul
if %errorlevel% == 0 (
    echo   [OK] Java is installed
) else (
    echo   [FAIL] Java not found
)

echo.
echo [2/6] Checking Maven...
mvn -version 2>&1 | findstr "Apache Maven" >nul
if %errorlevel% == 0 (
    echo   [OK] Maven is installed
) else (
    echo   [FAIL] Maven not found - restart PowerShell and try again
)

echo.
echo [3/6] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] Node.js is installed
) else (
    echo   [FAIL] Node.js not found
)

echo.
echo [4/6] Checking npm...
npm -v >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] npm is installed
) else (
    echo   [FAIL] npm not found - restart PowerShell and try again
)

echo.
echo [5/6] Checking Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] Python is installed
) else (
    echo   [FAIL] Python not found
)

echo.
echo [6/6] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] Docker is installed
) else (
    echo   [FAIL] Docker not found - restart PowerShell and try again
)

echo.
echo ==========================================
echo   Setup check complete!
echo ==========================================
echo.
echo If all tools show [OK], you can run the project with:
echo   1. docker compose up -d
echo   2. cd backend ^& mvn spring-boot:run
echo   3. cd ai-service ^& pip install -r requirements.txt ^& uvicorn app.main:app --reload --port 8000
echo   4. cd frontend ^& npm install ^& npm start
echo.
pause
