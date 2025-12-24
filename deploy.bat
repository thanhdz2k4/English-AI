@echo off
setlocal

cd /d "%~dp0"

echo === English AI Deploy ===
echo Working dir: %cd%
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Please install Node.js.
  exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  exit /b 1
)

echo Building project...
call npm run build
if errorlevel 1 (
  echo ERROR: build failed.
  exit /b 1
)

echo Deploying to Vercel...
call npx vercel --prod
if errorlevel 1 (
  echo ERROR: deploy failed.
  exit /b 1
)

echo Deploy completed.
endlocal
