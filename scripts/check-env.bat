@echo off
setlocal

cd /d "%~dp0\.."

set MISSING=0

if not exist "backend\.env" (
  echo [THIEU] backend\.env
  echo        Hay copy backend\.env.example thanh backend\.env va sua thong tin MySQL/JWT.
  set MISSING=1
) else (
  echo [OK] backend\.env
)

if not exist "frontend\.env" (
  echo [THIEU] frontend\.env
  echo        Hay copy frontend\.env.example thanh frontend\.env.
  set MISSING=1
) else (
  echo [OK] frontend\.env
)

echo.
if "%MISSING%"=="1" (
  echo Chua du file moi truong. Vui long tao file .env truoc khi chay he thong.
  pause
  exit /b 1
)

echo Da co du file .env cho backend va frontend.
pause
