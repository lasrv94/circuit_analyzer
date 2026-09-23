from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def generate():
    pdf_filename = "sample_unifilar.pdf"
    c = canvas.Canvas(pdf_filename, pagesize=(842, 595)) # A4 horizontal típico de planos CAD

    # --- PÁGINA 1: TABLERO GENERAL DE DISTRIBUCIÓN (TGD) ---
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#0f172a"))
    c.drawString(40, 555, "PROYECTO: SUBESTACIÓN Y DISTRIBUCIÓN ELÉCTRICA - EDIFICIO CORPORATIVO")
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(HexColor("#b91c1c"))
    c.drawString(40, 535, "PLANO 1: DIAGRAMA UNIFILAR - TABLERO GENERAL DE DISTRIBUCIÓN (480V / 277V, 3F, 4H)")

    # Marco exterior de plano de ingeniería
    c.setStrokeColor(HexColor("#334155"))
    c.setLineWidth(1.5)
    c.rect(30, 30, 782, 535)

    # 1. Acometida de Compañía Eléctrica
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(HexColor("#1e293b"))
    c.drawString(350, 495, "TRANSFORMADOR T-01")
    c.setFont("Helvetica", 9)
    c.drawString(350, 483, "750 kVA - 13.2 kV / 480-277V")
    
    # Línea de alimentación
    c.setStrokeColor(HexColor("#0f172a"))
    c.setLineWidth(2.5)
    c.line(420, 475, 420, 430)

    # Interruptor Principal (MAIN)
    c.setStrokeColor(HexColor("#b91c1c"))
    c.setLineWidth(2.5)
    c.rect(395, 385, 50, 45, fill=0)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(402, 403, "MAIN")
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(HexColor("#b91c1c"))
    c.drawString(455, 408, "3x1000A")
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#475569"))
    c.drawString(455, 395, "Interruptor Electromagnético Ajustable")

    # Salida del Main hacia la barra
    c.setStrokeColor(HexColor("#0f172a"))
    c.setLineWidth(2.5)
    c.line(420, 385, 420, 340)

    # BARRA COLECTORA PRINCIPAL (Main Busbar)
    c.setStrokeColor(HexColor("#1e3a8a"))
    c.setLineWidth(5)
    c.line(100, 340, 740, 340)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#1e3a8a"))
    c.drawString(100, 348, "BARRA COLECTORA PRINCIPAL TGD - 480V, 3F, 4H, 2000A, 65 kA I.C.")

    # 5 Subcircuitos derivados de 1er nivel
    subcircuits = [
        (160, "S-01: Chiller 1", "3x350A", "Alimentador Chiller Centrífugo 1"),
        (280, "S-02: Chiller 2", "3x350A", "Alimentador Chiller Centrífugo 2"),
        (400, "S-03: Fuerza TF-1", "3x225A", "Tablero Fuerza y Bombeo"),
        (530, "S-04: Transf. TX-2", "3x150A", "Transformador Seco Alumbrado 480-220V"),
        (660, "S-05: Centro Datos", "3x200A", "Alimentador UPS y SITE Central"),
    ]

    for x, tag, rating, desc in subcircuits:
        # Línea de derivación desde la barra
        c.setStrokeColor(HexColor("#0f172a"))
        c.setLineWidth(2)
        c.line(x, 340, x, 280)

        # Símbolo de interruptor termomagnético
        c.setStrokeColor(HexColor("#0f172a"))
        c.rect(x - 20, 240, 40, 40, fill=0)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(HexColor("#0f172a"))
        c.drawCentredString(x, 255, "CB")

        # Conductor de salida (donde se mide)
        c.line(x, 240, x, 180)

        # Cuadro de carga / destino
        c.setStrokeColor(HexColor("#64748b"))
        c.rect(x - 45, 120, 90, 60, fill=0)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#0f172a"))
        c.drawCentredString(x, 163, tag)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#b91c1c"))
        c.drawCentredString(x, 150, rating)
        c.setFont("Helvetica", 7)
        c.setFillColor(HexColor("#475569"))
        c.drawCentredString(x, 133, desc[:20])

    # Cuadro de sellos y notas normativas (esquina inferior derecha)
    c.setStrokeColor(HexColor("#94a3b8"))
    c.rect(480, 40, 320, 70)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#0f172a"))
    c.drawString(490, 95, "NOTAS DE SUBMEDICIÓN Y AUDITORÍA ENERGÉTICA:")
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#334155"))
    c.drawString(490, 82, "1. Medir acometida principal en bornes de carga del interruptor MAIN.")
    c.drawString(490, 70, "2. Medir cada alimentador de primer nivel derivado de la barra colectora.")
    c.drawString(490, 58, "3. Emplear TCs de núcleo partido con salida 0-333mV o donas Rogowski.")

    c.showPage()

    # --- PÁGINA 2: TABLERO DE EMERGENCIA / GENERADOR ---
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#0f172a"))
    c.drawString(40, 555, "PROYECTO: SUBESTACIÓN Y DISTRIBUCIÓN ELÉCTRICA - EDIFICIO CORPORATIVO")
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(HexColor("#d97706"))
    c.drawString(40, 535, "PLANO 2: DIAGRAMA UNIFILAR - SISTEMA DE EMERGENCIA Y PLANTA ELÉCTRICA")

    c.setStrokeColor(HexColor("#334155"))
    c.setLineWidth(1.5)
    c.rect(30, 30, 782, 535)

    # Generador Diésel
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#1e293b"))
    c.drawString(340, 480, "PLANTA DE EMERGENCIA DIESEL 350 kW")
    c.line(420, 460, 420, 400)
    
    # Interruptor Planta (MAIN Emergencia)
    c.setStrokeColor(HexColor("#d97706"))
    c.setLineWidth(2)
    c.rect(395, 360, 50, 40)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(405, 375, "MAIN-E")
    c.drawString(455, 375, "3x600A")

    # Barra Emergencia
    c.setStrokeColor(HexColor("#d97706"))
    c.setLineWidth(4)
    c.line(200, 320, 640, 320)
    c.drawString(200, 328, "BARRA EMERGENCIA 480V")

    # 3 Cargas críticas
    emerg_subs = [
        (280, "Bomba Incendio", "3x150A"),
        (420, "Elevadores", "3x125A"),
        (560, "Alumbrado Emerg.", "3x70A"),
    ]
    for x, name, rating in emerg_subs:
        c.line(x, 320, x, 260)
        c.rect(x - 15, 230, 30, 30)
        c.drawString(x - 20, 210, name)
        c.drawString(x - 15, 195, rating)

    c.showPage()
    c.save()
    print("sample_unifilar.pdf generado con éxito.")

if __name__ == "__main__":
    generate()
