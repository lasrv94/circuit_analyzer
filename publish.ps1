param(
    [string]$Message = "Release update",
    [string]$Bump = "patch"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Publicando en https://github.com/lasrv94/circuit_analyzer" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Asegurar git inicializado y remote configurado
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    git branch -M main
    git remote add origin https://github.com/lasrv94/circuit_analyzer
} else {
    $currentRemotes = git remote -v 2>&1
    if ($currentRemotes -notmatch "circuit_analyzer") {
        git remote remove origin 2>&1 | Out-Null
        git remote add origin https://github.com/lasrv94/circuit_analyzer
    }
}

# 2. Incrementar versión
Write-Host "[2/5] Incrementando version ($Bump)..." -ForegroundColor Yellow
$newVersion = & ".\backend\venv\Scripts\python.exe" bump_version.py $Bump
$newVersion = $newVersion.Trim()
Write-Host "Nueva version generada: v$newVersion" -ForegroundColor Green

# 3. Git add
Write-Host "[3/5] Preparando archivos para commit..." -ForegroundColor Yellow
git add .

# 4. Commit y Tag
Write-Host "[4/5] Creando commit y etiqueta v$newVersion..." -ForegroundColor Yellow
$commitMsg = "v$newVersion: $Message"
git commit -m $commitMsg
git tag -a "v$newVersion" -m "Release v$newVersion: $Message"

# 5. Push
Write-Host "[5/5] Enviando cambios y tags a GitHub..." -ForegroundColor Yellow
git push -u origin main
git push origin --tags

Write-Host "========================================================" -ForegroundColor Green
Write-Host " Publicacion completada exitosamente: v$newVersion" -ForegroundColor Green
Write-Host " URL: https://github.com/lasrv94/circuit_analyzer" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
