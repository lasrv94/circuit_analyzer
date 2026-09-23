# ⚡ Circuit Analyzer - Marcado y Submedición de Unifilares (Local AI & Ctrl+V)

Aplicación web interactiva e inteligente diseñada para ingenieros eléctricos, auditores energéticos y proyectistas. Permite cargar planos de diagramas unifilares en formato **PDF o Imagen**, o **pegar directamente capturas de pantalla desde el portapapeles con `Ctrl+V`**. El análisis de detección del Main y subcircuitos de 1er nivel se realiza **100% de forma local mediante OpenAI Codex CLI**, sin dependencias de servicios externos ni envío de datos a la nube.

Repositorio oficial: [https://github.com/lasrv94/circuit_analyzer](https://github.com/lasrv94/circuit_analyzer)

---

## 🚀 Inicio Rápido en Windows

Puedes iniciar tanto el backend como el frontend con un solo clic:

```bat
run_app.bat
```

O manualmente en dos terminales:

### 1. Iniciar el Backend (FastAPI)
```powershell
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload
```

### 2. Iniciar el Frontend (React + Vite)
```powershell
cd frontend
npm.cmd run dev
```

Abre tu navegador en: **`http://localhost:5173`**

---

## 📦 Publicación de Nuevas Versiones a GitHub

Para publicar cambios automáticamente con incremento de versión y etiquetado Git:

```bat
publish.bat "Descripción de los cambios"
```

O en PowerShell:
```powershell
.\publish.ps1 -Message "Descripción de los cambios" -Bump patch
```

Esto:
1. Incrementa automáticamente la versión semántica (ej: `1.0.0` -> `1.0.1`).
2. Sincroniza la versión en `package.json` y `backend/main.py`.
3. Crea un commit con la nueva versión.
4. Genera una etiqueta Git (tag `vX.Y.Z`).
5. Realiza `git push` y `git push --tags` hacia `https://github.com/lasrv94/circuit_analyzer`.

---

## 📋 Archivos de Prueba Incluidos

1. **`sample_unifilar.pdf`**: Plano eléctrico unifilar vectorial de 2 páginas (Tablero General con Main 1000A + 5 subcircuitos y Planta de Emergencia).
2. **`sample_unifilar.png`**: Diagrama unifilar en formato de imagen de alta resolución para probar la carga directa de imágenes o capturas.

---

## 🌟 Características Principales

### 1. Cargar o Pegar Imágenes Directamente (`Ctrl+V`)
- **Pegado con `Ctrl+V`**: Toma una captura con `Win + Shift + S` en AutoCAD, Revit, Bluebeam o el navegador, y al presionar `Ctrl+V` en la ventana de la aplicación, el plano se cargará al instante en el lienzo de trabajo.
- **Soporte de Formatos**: Archivos PDF (multipágina), PNG, JPG, JPEG, WEBP y BMP.
- **Lienzo Universal**: Renderizado vectorial nítido con PDF.js para PDFs o renderizado de alta definición para imágenes, ambos con zoom fluido (hasta 350%) y paneo.

### 2. Motor de IA Local: OpenAI Codex CLI
- **Ejecución 100% Soberana y Local**:
  - Detección automática del binario `codex.exe` en tu equipo (`C:\Users\lasrv\AppData\Local\OpenAI\Codex\bin\...\codex.exe`).
  - Utiliza `codex exec -i <imagen>` pasando la imagen del plano y extrayendo de forma estructurada las coordenadas del **Main** y de los **Subcircuitos de 1er nivel derivados de la barra**.
  - Sin necesidad de API Keys ni transmisión de planos fuera de tu máquina.
- **Indicador de Estado en Tiempo Real**: En la barra superior puedes consultar el estado y la versión de Codex CLI (`v0.155.0-alpha.9.2`).

### 3. Capa Interactiva de Círculos Rojos Arrastrables (Drag & Drop)
- **Mover libremente**: Arrastra cualquier círculo rojo a la posición exacta del conductor o barra.
- **Añadir Medidores**: Herramienta `+ Añadir Medidor` para colocar puntos con un solo clic.
- **Redimensionar Diámetro**: Deslizador de tamaño para simular el diámetro físico de la dona/TC.
- **Editar Propiedades**: Capacidad en Amperios, nombre del circuito y notas normativas.

### 4. Opciones de Exportación
- **Exportar PNG**: Descarga la imagen en alta resolución con los círculos y etiquetas estampados.
- **Exportar PDF**: Descarga el plano original (sea PDF o imagen convertida) con marcas vectoriales.
- **Exportar CSV**: Descarga el cuadro de medidores (Meter Schedule) para presupuestos.

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite de pruebas unitarias y de integración:

```powershell
.\backend\venv\Scripts\python.exe -m pytest backend/tests/test_backend.py -v
```
