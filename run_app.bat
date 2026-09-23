@echo off
echo ========================================================
echo  Iniciando ElectroSubmeter AI (Marcado de Unifilares)
echo ========================================================
echo.

REM Iniciar Backend FastAPI en una ventana
start "ElectroSubmeter Backend" cmd /k ".\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload"

REM Iniciar Frontend Vite
cd frontend
echo Iniciando Servidor Frontend en http://localhost:5173 ...
npm.cmd run dev

pause
