import unittest
import io
from reportlab.pdfgen import canvas
from pypdf import PdfReader

from backend.models import MeterPoint
from backend.services.codex_analyzer import analyze_diagram_with_codex
from backend.services.pdf_exporter import export_annotated_pdf

class TestElectricalSubmetering(unittest.TestCase):
    def test_fallback_points(self):
        result = analyze_diagram_with_codex(image_bytes=b"dummy_data", page_number=1)

        self.assertEqual(result.page, 1)
        self.assertTrue(len(result.points) >= 4)
        
        # Debe haber un medidor tipo Main
        mains = [p for p in result.points if p.type == 'main']
        self.assertEqual(len(mains), 1)
        self.assertEqual(mains[0].id, "M-01")

        # Debe haber al menos 3 subcircuitos
        subs = [p for p in result.points if p.type == 'subcircuit']
        self.assertTrue(len(subs) >= 3)

        # Validar coordenadas 0-100%
        for p in result.points:
            self.assertGreaterEqual(p.x, 0.0)
            self.assertLessEqual(p.x, 100.0)
            self.assertGreaterEqual(p.y, 0.0)
            self.assertLessEqual(p.y, 100.0)

    def test_pdf_export_annotation(self):
        # Crear un PDF simple en memoria
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(500, 500))
        c.drawString(100, 400, "Plano Unifilar de Prueba")
        c.showPage()
        c.save()
        original_bytes = buf.getvalue()

        points = [
            MeterPoint(
                id="M-01",
                label="M-01: Main",
                circuit_name="General",
                type="main",
                x=50.0,
                y=30.0,
                radius=18.0,
                rating_amps=600,
                confidence=0.99,
                page=1
            ),
            MeterPoint(
                id="S-01",
                label="S-01: Cargas",
                circuit_name="Fuerza",
                type="subcircuit",
                x=25.0,
                y=60.0,
                radius=15.0,
                rating_amps=200,
                confidence=0.95,
                page=1
            )
        ]

        annotated_bytes = export_annotated_pdf(original_bytes, {1: points})
        self.assertGreater(len(annotated_bytes), len(original_bytes))

        # Verificar que es legible y tiene 1 página
        reader = PdfReader(io.BytesIO(annotated_bytes))
        self.assertEqual(len(reader.pages), 1)

if __name__ == '__main__':
    unittest.main()
