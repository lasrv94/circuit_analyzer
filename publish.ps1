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
    Write-Host "[1/6] Inicializando repositorio Git..." -ForegroundColor Yellow
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
Write-Host "[2/6] Incrementando version ($Bump)..." -ForegroundColor Yellow
$newVersion = & ".\backend\venv\Scripts\python.exe" bump_version.py $Bump
$newVersion = $newVersion.Trim()
Write-Host "Nueva version generada: v$newVersion" -ForegroundColor Green

# 3. Compilar frontend para producción (dist)
Write-Host "[3/6] Compilando frontend para GitHub Pages (dist)..." -ForegroundColor Yellow
npm.cmd --prefix frontend run build

# 4. Commit y Tag en main
Write-Host "[4/6] Creando commit y etiqueta v$newVersion en main..." -ForegroundColor Yellow
git add .
$commitMsg = "v${newVersion}: $Message"
git commit -m $commitMsg
git tag -a "v$newVersion" -m "Release v${newVersion}: $Message"

# 5. Push de main y tags a GitHub
Write-Host "[5/6] Enviando rama main y tags a GitHub..." -ForegroundColor Yellow
git push -u origin main
git push origin --tags

# 6. Despliegue de frontend/dist a la rama gh-pages (GitHub Pages directo)
Write-Host "[6/6] Desplegando aplicacion web compilada a rama gh-pages..." -ForegroundColor Yellow
$distPath = (Resolve-Path "frontend/dist").Path
Push-Location $distPath
try {
    git init | Out-Null
    git config user.name "lasrv94"
    git config user.email "lasrv94@users.noreply.github.com"
    git branch -M gh-pages
    git remote add origin https://github.com/lasrv94/circuit_analyzer
    git add -A
    git commit -m "Deploy v${newVersion} frontend to GitHub Pages" | Out-Null
    git push -f origin gh-pages
} finally {
    if (Test-Path ".git") {
        Remove-Item -Recurse -Force .git
    }
    Pop-Location
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host " Publicacion completada exitosamente: v$newVersion" -ForegroundColor Green
Write-Host " Repositorio: https://github.com/lasrv94/circuit_analyzer" -ForegroundColor Green
Write-Host " Web App:     https://lasrv94.github.io/circuit_analyzer/" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
