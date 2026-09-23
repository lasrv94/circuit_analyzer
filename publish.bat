@echo off
setlocal
set MSG=%~1
if "%MSG%"=="" (
    set /p MSG="Ingresa el mensaje de la version: "
)
if "%MSG%"=="" set MSG=Update release

powershell -ExecutionPolicy Bypass -File .\publish.ps1 -Message "%MSG%"
pause
