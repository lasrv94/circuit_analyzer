import os
import io
import json
import uuid
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv

from backend.models import MeterPoint, PageAnalysisResult, ExportPdfRequest
from backend.services.codex_analyzer import analyze_diagram_with_codex, get_codex_status
from backend.services.pdf_exporter import export_annotated_pdf, export_annotated_image, export_image_as_pdf

load_dotenv()

app = FastAPI(
    title="ElectroSubmeter AI - Codex CLI & Image/PDF Markup API",
    description="API local para marcado y submedición de diagramas unifilares con Codex CLI",
    version="2.0.0"
)

# Permitir CORS para desarrollo local con Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

@app.get("/api/health")
def health_check():
    status = get_codex_status()
    return {
        "status": "healthy",
        "ai_engine": "codex_cli_local",
        "codex_found": status["found"],
        "codex_version": status["version"],
        "message": "Servidor listo con motor local de Codex CLI"
    }

@app.get("/api/codex-status")
def codex_status_endpoint():
    """Retorna información detallada sobre la instalación local de Codex CLI."""
    return get_codex_status()

@app.post("/api/upload")
async def upload_document_or_image(file: UploadFile = File(...)):
    """
    Permite cargar tanto planos en PDF (con múltiples páginas)
    como imágenes directas (PNG, JPG, WEBP, capturas de pantalla).
    """
    ext = Path(file.filename).suffix.lower()
    is_pdf = ext == ".pdf"
    is_image = ext in IMAGE_EXTENSIONS

    if not is_pdf and not is_image:
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Debe ser un archivo PDF o una imagen (PNG, JPG, WEBP, BMP)."
        )

    unique_id = uuid.uuid4().hex[:8]
    safe_filename = f"{unique_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    total_pages = 1
    if is_pdf:
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            total_pages = len(reader.pages)
        except Exception:
            total_pages = 1

    return {
        "filename": safe_filename,
        "original_name": file.filename,
        "file_type": "pdf" if is_pdf else "image",
        "total_pages": total_pages,
        "size_bytes": file_path.stat().st_size
    }

@app.post("/api/analyze-page")
async def analyze_page(
    page: int = Form(1),
    filename: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Analiza la topología eléctrica usando el motor local de Codex CLI.
    Recibe la captura del lienzo (PNG) generada por el frontend o lee el archivo del servidor.
    """
    image_bytes = None

    if image is not None:
        image_bytes = await image.read()
    elif filename:
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor.")
        
        ext = file_path.suffix.lower()
        if ext in IMAGE_EXTENSIONS:
            with open(file_path, "rb") as f:
                image_bytes = f.read()
        elif ext == ".pdf":
            # Si es PDF y no se envió captura, intentar extraer con PyMuPDF si existe
            try:
                import fitz
                doc = fitz.open(file_path)
                if 1 <= page <= len(doc):
                    pdf_page = doc[page - 1]
                    pix = pdf_page.get_pixmap(dpi=150)
                    image_bytes = pix.tobytes("png")
                doc.close()
            except ImportError:
                image_bytes = b""
        else:
            image_bytes = b""
    else:
        image_bytes = b""

    result = analyze_diagram_with_codex(image_bytes=image_bytes, page_number=page)
    return result

@app.post("/api/export-pdf")
async def export_pdf(
    filename: str = Form(...),
    annotations_json: str = Form(...)
):
    """
    Exporta el documento con los círculos rojos estampados vectorialmente.
    Soporta tanto archivos PDF originales como imágenes convertidas a PDF.
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")

    try:
        points_data = json.loads(annotations_json)
        points_by_page = {}
        points_list = []
        for item in points_data:
            pt = MeterPoint(**item)
            points_by_page.setdefault(pt.page, []).append(pt)
            points_list.append(pt)

        with open(file_path, "rb") as f:
            original_bytes = f.read()

        ext = file_path.suffix.lower()
        if ext in IMAGE_EXTENSIONS:
            annotated_bytes = export_image_as_pdf(original_bytes, points_list)
            export_name = f"submedicion_{file_path.stem}.pdf"
        else:
            annotated_bytes = export_annotated_pdf(original_bytes, points_by_page)
            export_name = f"submedicion_{filename}"

        return Response(
            content=annotated_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={export_name}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")

@app.post("/api/export-image")
async def export_image(
    filename: str = Form(...),
    annotations_json: str = Form(...)
):
    """
    Exporta la imagen con los círculos rojos estampados directamente como archivo PNG de alta resolución.
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")

    try:
        points_data = json.loads(annotations_json)
        points_list = [MeterPoint(**item) for item in points_data]

        with open(file_path, "rb") as f:
            image_bytes = f.read()

        annotated_image_bytes = export_annotated_image(image_bytes, points_list)

        return Response(
            content=annotated_image_bytes,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=marcado_{file_path.stem}.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar imagen anotada: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
