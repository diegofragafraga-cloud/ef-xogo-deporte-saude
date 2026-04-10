#!/usr/bin/env python3
"""Genera el PDF de registro semanal de la Superliga Saludable."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import os

# Colores
GREEN = HexColor("#1a7a4c")
GREEN_LIGHT = HexColor("#e8f5ee")
VIOLET = HexColor("#8b5cf6")
BLUE = HexColor("#0ea5e9")
AMBER = HexColor("#f59e0b")
TEXT = HexColor("#1e293b")
GRAY = HexColor("#64748b")
GRAY_LIGHT = HexColor("#f8fafc")
BORDER = HexColor("#cbd5e1")
BORDER_LIGHT = HexColor("#e2e8f0")
ROW_ALT = HexColor("#f8fafc")

OUTPUT_PATH = os.path.expanduser("~/Desktop/SUPERLIGA SAUDABLE/registro-semanal-superliga.pdf")
WIDTH, HEIGHT = A4  # 210 x 297 mm

def draw_heart_pulse(c, x, y, size=14*mm):
    """Dibuja un icono de corazón con pulso."""
    # Fondo verde redondeado
    c.setFillColor(GREEN)
    c.roundRect(x, y, size, size, 3*mm, fill=1, stroke=0)

    # Corazón simplificado en blanco
    c.setStrokeColor(white)
    c.setLineWidth(1.5)
    c.setFillColor(white)

    cx = x + size/2
    cy = y + size/2 + 1*mm
    s = size * 0.28

    # Dibujar corazón con path
    p = c.beginPath()
    p.moveTo(cx, cy - s*0.6)
    # Lado izquierdo
    p.curveTo(cx - s*0.1, cy + s*0.2, cx - s*0.9, cy + s*0.5, cx - s*0.9, cy + s*0.1)
    p.curveTo(cx - s*0.9, cy - s*0.5, cx - s*0.3, cy - s*0.8, cx, cy - s*0.4)
    # Lado derecho
    p.curveTo(cx + s*0.3, cy - s*0.8, cx + s*0.9, cy - s*0.5, cx + s*0.9, cy + s*0.1)
    p.curveTo(cx + s*0.9, cy + s*0.5, cx + s*0.1, cy + s*0.2, cx, cy - s*0.6)
    c.drawPath(p, fill=1, stroke=0)

    # Línea de pulso
    c.setLineWidth(1.2)
    py = cy - 0.5*mm
    pulse_x = cx - s*0.7
    pulse_w = s*1.4
    p2 = c.beginPath()
    p2.moveTo(pulse_x, py)
    p2.lineTo(pulse_x + pulse_w*0.25, py)
    p2.lineTo(pulse_x + pulse_w*0.35, py + s*0.5)
    p2.lineTo(pulse_x + pulse_w*0.5, py - s*0.6)
    p2.lineTo(pulse_x + pulse_w*0.6, py + s*0.3)
    p2.lineTo(pulse_x + pulse_w*0.7, py)
    p2.lineTo(pulse_x + pulse_w, py)
    c.drawPath(p2, fill=0, stroke=1)


def draw_dashed_rect(c, x, y, w, h, dash=[2, 2]):
    """Rectángulo con borde punteado."""
    c.saveState()
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.setDash(dash[0], dash[1])
    c.rect(x, y, w, h, fill=0, stroke=1)
    c.restoreState()


def create_pdf():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)
    c.setTitle("Superliga Saludable - Rexistro Semanal")

    margin = 20*mm
    content_w = WIDTH - 2*margin
    ypos = HEIGHT - margin

    # ========== CABECERA ==========
    icon_size = 14*mm
    draw_heart_pulse(c, margin, ypos - icon_size, icon_size)

    # Título
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(GREEN)
    c.drawString(margin + icon_size + 5*mm, ypos - 6*mm, "Superliga Saludable")

    # Subtítulo
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    c.drawString(margin + icon_size + 5*mm, ypos - 12*mm, "Rexistro semanal de actividade física en horario lectivo")

    # Línea separadora
    ypos -= icon_size + 4*mm
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.line(margin, ypos, WIDTH - margin, ypos)

    ypos -= 10*mm

    # ========== CAMPOS INFO ==========
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)

    # Clase
    c.drawString(margin, ypos, "CLASE")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.line(margin + 14*mm, ypos - 1*mm, margin + 55*mm, ypos - 1*mm)

    # Semana
    c.drawString(margin + 62*mm, ypos, "SEMANA DO")
    c.line(margin + 82*mm, ypos - 1*mm, margin + 115*mm, ypos - 1*mm)

    c.drawString(margin + 118*mm, ypos, "AO")
    c.line(margin + 126*mm, ypos - 1*mm, margin + content_w, ypos - 1*mm)

    ypos -= 10*mm

    # ========== LEYENDA ==========
    legend_h = 14*mm
    c.setFillColor(GRAY_LIGHT)
    c.setStrokeColor(BORDER_LIGHT)
    c.setLineWidth(0.5)
    c.roundRect(margin, ypos - legend_h, content_w, legend_h, 2*mm, fill=1, stroke=1)

    items = [
        (VIOLET, "Espertares máxicos:", "activación ao comezo da xornada"),
        (BLUE, "Descansos activos:", "pausas con movemento entre clases"),
        (AMBER, "Método HERVAT:", "hidratación, estiramentos, respiración, vista, audición, tacto"),
    ]

    item_y = ypos - 4.5*mm
    item_x_start = margin + 4*mm
    spacing = content_w / 3

    for i, (color, title, desc) in enumerate(items):
        ix = item_x_start + i * spacing

        # Punto de color
        c.setFillColor(color)
        c.circle(ix + 1.5*mm, item_y - 1.5*mm, 1.5*mm, fill=1, stroke=0)

        # Texto
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(HexColor("#475569"))
        c.drawString(ix + 5*mm, item_y - 0.5*mm, title)

        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#475569"))
        c.drawString(ix + 5*mm, item_y - 4.5*mm, desc)

    ypos -= legend_h + 6*mm

    # ========== TABLA ==========
    cols = ["Día", "Espertares\nmáxicos", "Descansos\nactivos", "Método\nHERVAT", "Total", "Puntos"]
    col_widths = [24*mm, 28*mm, 28*mm, 28*mm, 22*mm, 22*mm]

    # Ajustar para que ocupe todo el ancho
    total_cols = sum(col_widths)
    scale = content_w / total_cols
    col_widths = [w * scale for w in col_widths]

    header_h = 12*mm
    row_h = 10*mm
    days = ["Luns", "Martes", "Mércores", "Xoves", "Venres"]

    # Cabecera de tabla
    x = margin
    c.setFillColor(GREEN)
    # Esquinas redondeadas solo arriba
    c.roundRect(x, ypos - header_h, content_w, header_h, 2*mm, fill=1, stroke=0)
    # Rectángulo para tapar las esquinas redondeadas de abajo
    c.rect(x, ypos - header_h, content_w, header_h/2, fill=1, stroke=0)

    c.setFillColor(white)
    cx = margin
    for i, (col, w) in enumerate(zip(cols, col_widths)):
        lines = col.split("\n")
        c.setFont("Helvetica-Bold", 7)
        if len(lines) == 2:
            c.drawCentredString(cx + w/2, ypos - 4.5*mm, lines[0])
            c.drawCentredString(cx + w/2, ypos - 8.5*mm, lines[1])
        else:
            c.drawCentredString(cx + w/2, ypos - 5*mm, lines[0])
            c.setFont("Helvetica", 5.5)
            if i > 0 and i < 5:
                c.drawCentredString(cx + w/2, ypos - 9*mm, "minutos")
        cx += w

    ypos -= header_h

    # Filas de datos
    for row_idx, day in enumerate(days):
        row_y = ypos - row_h

        # Fondo alterno
        if row_idx % 2 == 1:
            c.setFillColor(ROW_ALT)
            c.rect(margin, row_y, content_w, row_h, fill=1, stroke=0)

        # Borde inferior
        c.setStrokeColor(BORDER_LIGHT)
        c.setLineWidth(0.3)
        c.line(margin, row_y, margin + content_w, row_y)

        # Nombre del día
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(GREEN)
        c.drawString(margin + 3*mm, row_y + row_h/2 - 1.5*mm, day)

        # Celdas vacías con borde punteado
        cx = margin + col_widths[0]
        for i in range(5):  # 5 celdas de datos
            cell_w = col_widths[i + 1]
            cell_inner_w = cell_w - 6*mm
            cell_inner_h = row_h - 4*mm
            cell_x = cx + 3*mm
            cell_y = row_y + 2*mm
            draw_dashed_rect(c, cell_x, cell_y, cell_inner_w, cell_inner_h)
            cx += cell_w

        ypos -= row_h

    # Fila TOTAL SEMANAL
    total_row_y = ypos - row_h
    c.setFillColor(GREEN_LIGHT)
    c.rect(margin, total_row_y, content_w, row_h, fill=1, stroke=0)

    # Borde superior grueso
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(margin, ypos, margin + content_w, ypos)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GREEN)
    c.drawString(margin + 3*mm, total_row_y + row_h/2 - 1.5*mm, "TOTAL SEMANAL")

    cx = margin + col_widths[0]
    for i in range(5):
        cell_w = col_widths[i + 1]
        cell_inner_w = cell_w - 6*mm
        cell_inner_h = row_h - 4*mm
        cell_x = cx + 3*mm
        cell_y = total_row_y + 2*mm
        draw_dashed_rect(c, cell_x, cell_y, cell_inner_w, cell_inner_h)
        cx += cell_w

    ypos = total_row_y - 6*mm

    # ========== SISTEMA DE PUNTUACIÓN ==========
    scoring_h = 28*mm
    c.setFillColor(GRAY_LIGHT)
    c.setStrokeColor(BORDER_LIGHT)
    c.setLineWidth(0.5)
    c.roundRect(margin, ypos - scoring_h, content_w, scoring_h, 2*mm, fill=1, stroke=1)

    sy = ypos - 5*mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(GREEN)
    c.drawString(margin + 4*mm, sy, "Sistema de puntuación")

    sy -= 6*mm
    scoring_items = [
        "Cada actividade realizada (mín. 3 min)  →  1 punto",
        "Bonus: 3 actividades no mesmo día  →  +1 punto",
        "Bonus: superar 15 min totais no día  →  +1 punto",
    ]

    c.setFont("Helvetica", 8)
    c.setFillColor(TEXT)
    for item in scoring_items:
        # Bullet
        c.circle(margin + 6*mm, sy + 1*mm, 0.8*mm, fill=1, stroke=0)
        c.drawString(margin + 10*mm, sy, item)
        sy -= 5*mm

    sy -= 1*mm
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(GREEN)
    c.drawString(margin + 10*mm, sy, "Máximo: 5 puntos/día  ·  25 puntos/semana")

    ypos -= scoring_h + 6*mm

    # ========== OBSERVACIÓNS ==========
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)
    c.drawString(margin, ypos, "OBSERVACIÓNS")

    ypos -= 3*mm
    obs_h = 22*mm
    draw_dashed_rect(c, margin, ypos - obs_h, content_w, obs_h)

    ypos -= obs_h + 6*mm

    # ========== FOOTER ==========
    c.setStrokeColor(BORDER_LIGHT)
    c.setLineWidth(0.5)
    c.line(margin, ypos, WIDTH - margin, ypos)

    ypos -= 4*mm
    c.setFont("Helvetica", 6.5)
    c.setFillColor(HexColor("#94a3b8"))
    c.drawString(margin, ypos, "CEIP Coirón-Dena  ·  Proxecto Dena Activa")
    c.drawRightString(WIDTH - margin, ypos, "Superliga Saludable 2025-2026")

    c.save()
    print(f"PDF generado: {OUTPUT_PATH}")


if __name__ == "__main__":
    create_pdf()
