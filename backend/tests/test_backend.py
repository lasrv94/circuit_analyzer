import io
import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from pypdf import PdfReader
from PIL import Image

from backend.main import app
from backend.models import MeterPoint
from backend.services.codex_analyzer import analyze_diagram_with_codex, get_codex_status
from backend.services.pdf_exporter import export_annotated_pdf, export_annotated_image, export_image_as_pdf

client = TestClient(app)

def create_sample_electrical_pdf() -> bytes:
    """Genera un PDF de prueba de 2 páginas con un diagrama unifilar simulado."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(600, 800))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "DIAGRAMA UNIFILAR - SUBESTACIÓN 1")
    c.rect(280, 610, 40, 40)
    c.drawString(285, 625, "MAIN")
    c.line(100, 560, 500, 560)
    c.showPage()
    c.drawString(50, 750, "PÁGINA 2 - EMERGENCIA")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def create_sample_image() -> bytes:
    """Genera una imagen PNG de prueba simulando un diagrama unifilar."""
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ai_engine"] == "codex_cli_local"
    assert "codex_found" in data

def test_codex_status():
    response = client.get("/api/codex-status")
    assert response.status_code == 200
    data = response.json()
    assert "found" in data
    assert "version" in data

def test_codex_electrical_analysis():
    img_bytes = create_sample_image()
    result = analyze_diagram_with_codex(image_bytes=img_bytes, page_number=1)
    assert result.page == 1
    assert isinstance(result.points, list)
    assert len(result.summary) > 0
    assert len(result.rules_applied) >= 1

    # Validar que si hay puntos, sus coordenadas sean consistentes
    for p in result.points:
        assert 0.0 <= p.x <= 100.0
        assert 0.0 <= p.y <= 100.0


def test_pdf_export_stamping():
    original_pdf = create_sample_electrical_pdf()
    points_page1 = [
        MeterPoint(
            id="M-01",
            label="M-01: Main",
            circuit_name="Interruptor Principal General",
            type="main",
            x=50.0,
            y=23.0,
            radius=18.0,
            rating_amps=800,
            confidence=0.99,
            legal_notes="Instalar en terminales de carga",
            page=1
        )
    ]
    annotated_pdf = export_annotated_pdf(original_pdf, {1: points_page1})
    assert len(annotated_pdf) > len(original_pdf)
    reader = PdfReader(io.BytesIO(annotated_pdf))
    assert len(reader.pages) == 2

def test_image_export_stamping():
    original_img = create_sample_image()
    points = [
        MeterPoint(
            id="M-01",
            label="M-01: Main",
            circuit_name="Acometida General",
            type="main",
            x=50.0,
            y=30.0,
            radius=20.0,
            rating_amps=1000,
            confidence=0.99,
            page=1
        ),
        MeterPoint(
            id="S-01",
            label="S-01: Chiller",
            circuit_name="Climas",
            type="subcircuit",
            x=25.0,
            y=60.0,
            radius=16.0,
            rating_amps=350,
            confidence=0.95,
            page=1
        )
    ]

    # Test PNG annotation
    annotated_img_bytes = export_annotated_image(original_img, points)
    assert len(annotated_img_bytes) > 0
    img = Image.open(io.BytesIO(annotated_img_bytes))
    assert img.size == (800, 600)

    # Test image converted to annotated PDF
    annotated_pdf_bytes = export_image_as_pdf(original_img, points)
    assert len(annotated_pdf_bytes) > 0
    reader = PdfReader(io.BytesIO(annotated_pdf_bytes))
    assert len(reader.pages) == 1
