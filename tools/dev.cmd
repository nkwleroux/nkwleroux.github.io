@echo off
setlocal
cd /d "%~dp0\.."
call npm run dev
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
