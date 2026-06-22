@echo off
REM ════════════════════════════════════════════════════════
REM  Fitness Tracker v4 — Local Server Launcher
REM  الاستخدام: انقر مرتين على هذا الملف
REM  ثم افتح: http://localhost:8766/
REM ════════════════════════════════════════════════════════

echo.
echo   ╔════════════════════════════════════════════╗
echo   ║  Fitness Tracker v4 — Starting server...   ║
echo   ╚════════════════════════════════════════════╝
echo.

cd /d D:\fitness

REM Try ports 8766, 8767, 8768, 8769, 8770
set PORT=8766
:TRY_PORT
netstat -an | find ":%PORT% " | find "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo Port %PORT% is busy, trying next...
    set /a PORT+=1
    if %PORT% GTR 8770 (
        echo ERROR: No free port found in 8766-8770
        pause
        exit /b 1
    )
    goto :TRY_PORT
)

echo Server starting on port %PORT%...
echo.
echo   >>> Open: http://localhost:%PORT%/  in your browser <<<
echo.
echo   To stop: close this window or press Ctrl+C
echo.

start http://localhost:%PORT%/

python -m http.server %PORT%

pause
