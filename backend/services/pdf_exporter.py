import io
from typing import List, Dict
from PIL import Image, ImageDraw, ImageFont
from backend.models import MeterPoint

def export_annotated_pdf(original_pdf_bytes: bytes, points_by_page: Dict[int, List[MeterPoint]]) -> bytes:
    """
    Superpone los círculos rojos y etiquetas identificadoras sobre el PDF original.
    Utiliza PyMuPDF si está presente, o pypdf + reportlab como motor vectorial nativo.
    """
    # 1. Intentar con PyMuPDF (fitz) si está disponible
    try:
        import fitz
        doc = fitz.open(stream=original_pdf_bytes, filetype="pdf")
        red_stroke = (0.9, 0.1, 0.1)
        gold_stroke = (0.95, 0.6, 0.0)
        white = (1.0, 1.0, 1.0)
        
        for page_num in range(len(doc)):
            page_idx_1based = page_num + 1
            if page_idx_1based not in points_by_page:
                continue
                
            page = doc[page_num]
            rect = page.rect
            width = rect.width
            height = rect.height
            
            for pt in points_by_page[page_idx_1based]:
                cx = (pt.x / 100.0) * width
                cy = (pt.y / 100.0) * height
                r = pt.radius if pt.radius > 5 else 16.0
                
                is_main = pt.type.lower() == "main"
                stroke_color = gold_stroke if is_main else red_stroke
                
                # Círculo exterior
                page.draw_circle(fitz.Point(cx, cy), r, color=stroke_color, width=2.5)
                # Punto central
                page.draw_circle(fitz.Point(cx, cy), 2.0, color=stroke_color, fill=stroke_color)
                # Etiqueta
                label_text = f"{pt.id}: {pt.circuit_name[:18]}" if pt.circuit_name else pt.label
                text_rect = fitz.Rect(cx - r - 5, cy + r + 2, cx + r + 60, cy + r + 16)
                page.draw_rect(text_rect, color=stroke_color, fill=white, width=1.0)
                page.insert_text(fitz.Point(cx - r - 2, cy + r + 12), label_text, fontsize=8, color=(0.1, 0.1, 0.1))
                
        out_buf = io.BytesIO()
        doc.save(out_buf)
        doc.close()
        return out_buf.getvalue()
    except Exception:
        pass

    # 2. Utilizar pypdf + reportlab (100% Python puro)
    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import HexColor

        reader = PdfReader(io.BytesIO(original_pdf_bytes))
        writer = PdfWriter()

        for page_idx, page in enumerate(reader.pages):
            page_num_1based = page_idx + 1
            
            if page_num_1based in points_by_page and points_by_page[page_num_1based]:
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)

                packet = io.BytesIO()
                can = canvas.Canvas(packet, pagesize=(page_width, page_height))

                for pt in points_by_page[page_num_1based]:
                    cx = (pt.x / 100.0) * page_width
                    cy = page_height - ((pt.y / 100.0) * page_height)
                    r = pt.radius if pt.radius > 5 else 16.0

                    is_main = pt.type.lower() == "main"
                    circle_color = HexColor("#f59e0b") if is_main else HexColor("#ef4444")
                    
                    can.setStrokeColor(circle_color)
                    can.setLineWidth(2.5)
                    can.circle(cx, cy, r, stroke=1, fill=0)

                    # Cruz central
                    can.setLineWidth(1.2)
                    can.line(cx - 5, cy, cx + 5, cy)
                    can.line(cx, cy - 5, cx, cy + 5)

                    # Etiqueta
                    label_text = f"{pt.id} ({pt.rating_amps}A)" if pt.rating_amps else pt.id
                    can.setFont("Helvetica-Bold", 8)
                    text_w = can.stringWidth(label_text, "Helvetica-Bold", 8)
                    
                    can.setFillColor(HexColor("#0f172a"))
                    can.roundRect(cx + r + 2, cy - 6, text_w + 8, 14, 2, stroke=1, fill=1)
                    can.setFillColor(HexColor("#ffffff"))
                    can.drawString(cx + r + 6, cy - 3, label_text)

                can.save()
                packet.seek(0)

                overlay_reader = PdfReader(packet)
                page.merge_page(overlay_reader.pages[0])

            writer.add_page(page)

        output_stream = io.BytesIO()
        writer.write(output_stream)
        return output_stream.getvalue()

    except Exception as e:
        print(f"Error exportando PDF: {e}")
        return original_pdf_bytes

def export_annotated_image(image_bytes: bytes, points: List[MeterPoint]) -> bytes:
    """
    Dibuja los círculos rojos y etiquetas identificadoras directamente sobre la imagen (PNG/JPG).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    width, height = img.size
    
    for pt in points:
        cx = int((pt.x / 100.0) * width)
        cy = int((pt.y / 100.0) * height)
        # Escalar radio proporcional al tamaño de la imagen
        scale_factor = max(1.0, width / 1200.0)
        r = int((pt.radius or 16) * scale_factor)
        
        is_main = pt.type.lower() == "main"
        stroke_color = (245, 158, 11, 235) if is_main else (239, 68, 68, 235)
        fill_color = (245, 158, 11, 45) if is_main else (239, 68, 68, 45)
        
        # 1. Círculo relleno semitransparente y borde
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill_color, outline=stroke_color, width=max(2, int(3 * scale_factor)))
        
        # 2. Cruz central
        draw.line([cx - int(6 * scale_factor), cy, cx + int(6 * scale_factor), cy], fill=stroke_color, width=max(1, int(2 * scale_factor)))
        draw.line([cx, cy - int(6 * scale_factor), cx, cy + int(6 * scale_factor)], fill=stroke_color, width=max(1, int(2 * scale_factor)))
        
        # 3. Etiqueta
        label_text = f"{pt.id}: {pt.circuit_name[:16]}" if pt.circuit_name else pt.label
        tag_x = cx + r + 4
        tag_y = cy - int(10 * scale_factor)
        
        box_w = int(len(label_text) * 8 * scale_factor + 12)
        box_h = int(18 * scale_factor)
        draw.rectangle([tag_x, tag_y, tag_x + box_w, tag_y + box_h], fill=(15, 23, 42, 230), outline=stroke_color, width=1)
        draw.text((tag_x + 6, tag_y + int(2 * scale_factor)), label_text, fill=(255, 255, 255, 255))
        
    combined = Image.alpha_composite(img, overlay)
    
    out_buf = io.BytesIO()
    combined.convert("RGB").save(out_buf, format="PNG")
    return out_buf.getvalue()

def export_image_as_pdf(image_bytes: bytes, points: List[MeterPoint]) -> bytes:
    """
    Convierte una imagen anotada en un documento PDF de alta calidad.
    """
    annotated_img_bytes = export_annotated_image(image_bytes, points)
    img = Image.open(io.BytesIO(annotated_img_bytes)).convert("RGB")
    out_pdf = io.BytesIO()
    img.save(out_pdf, format="PDF", resolution=150.0)
    return out_pdf.getvalue()
