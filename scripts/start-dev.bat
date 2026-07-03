@echo off
setlocal

cd /d "%~dp0\.."
set "PROJECT_ROOT=%CD%"

if not exist "backend\.env" (
  echo Thieu backend\.env. Hay copy backend\.env.example thanh backend\.env.
  pause
  exit /b 1
)

if not exist "frontend\.env" (
  echo Thieu frontend\.env. Hay copy frontend\.env.example thanh frontend\.env.
  pause
  exit /b 1
)

echo Dang mo backend va frontend o 2 cua so rieng...

start "LMS Backend" cmd /k "cd /d ""%PROJECT_ROOT%\backend"" && npm run dev"
start "LMS Frontend" cmd /k "cd /d ""%PROJECT_ROOT%\frontend"" && npm run dev"

echo.
echo Backend mac dinh:  http://localhost:5000
echo Frontend mac dinh: http://localhost:5173
echo.
pause
