@echo off
setlocal

cd /d "%~dp0\.."

echo ========================================
echo Cai dat thu vien cho backend
echo ========================================
cd backend
call npm install
if errorlevel 1 (
  echo.
  echo Loi khi npm install backend.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Cai dat thu vien cho frontend
echo ========================================
cd ..\frontend
call npm install
if errorlevel 1 (
  echo.
  echo Loi khi npm install frontend.
  pause
  exit /b 1
)

cd ..
echo.
echo ========================================
echo Da cai dat xong backend va frontend.
echo ========================================
pause
