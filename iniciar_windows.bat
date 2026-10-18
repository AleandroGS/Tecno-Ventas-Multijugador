@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Necesitas instalar Node.js desde https://nodejs.org/
 pause
 exit /b 1
)
echo Iniciando TECNO VENTAS. Visita http://localhost:3000
npm start
pause
