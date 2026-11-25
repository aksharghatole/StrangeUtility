@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Please install Node.js from https://nodejs.org/ first.
 pause
 exit /b 1
)
echo Open http://localhost:3000 in your browser.
node server.cjs
pause
