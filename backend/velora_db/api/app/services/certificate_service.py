from datetime import datetime
from pathlib import Path
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics, ttfonts
from reportlab.pdfgen import canvas


BASE_DIR = Path(__file__).resolve().parents[2]
ASSETS_DIR = BASE_DIR / "assets"
CERTIFICATES_DIR = BASE_DIR / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)

_FONTS_REGISTERED = False


def _register_fonts() -> None:
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return
    bold_font = ASSETS_DIR / "font_bold.ttf"
    regular_font = ASSETS_DIR / "font_regular.ttf"
    if bold_font.exists():
        pdfmetrics.registerFont(ttfonts.TTFont("CustomBold", str(bold_font)))
    if regular_font.exists():
        pdfmetrics.registerFont(ttfonts.TTFont("CustomRegular", str(regular_font)))
    _FONTS_REGISTERED = True


def _safe_image(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    if not path.exists():
        return
    try:
        c.drawImage(str(path), x, y, width=w, height=h, preserveAspectRatio=True, mask="auto")
    except Exception:
        return


def generate_certificate(name: str, course: str) -> tuple[str, str]:
    _register_fonts()

    cert_id = str(uuid4())[:8]
    file_path = CERTIFICATES_DIR / f"{cert_id}.pdf"

    width, height = landscape(A4)
    c = canvas.Canvas(str(file_path), pagesize=(width, height))

    c.setFillColorRGB(0.94, 0.96, 1)
    c.rect(0, 0, width, height, fill=1)

    c.setStrokeColorRGB(0.83, 0.69, 0.22)
    c.setLineWidth(10)
    c.rect(20, 20, width - 40, height - 40)

    c.setStrokeColorRGB(0.1, 0.2, 0.6)
    c.setLineWidth(2)
    c.rect(40, 40, width - 80, height - 80)

    _safe_image(c, ASSETS_DIR / "watermark.png", width / 2 - 200, height / 2 - 200, 400, 400)
    _safe_image(c, ASSETS_DIR / "logo.png", width / 2 - 35, height - 120, 70, 70)

    title_font = "CustomBold" if "CustomBold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
    body_font = "CustomRegular" if "CustomRegular" in pdfmetrics.getRegisteredFontNames() else "Helvetica"

    c.setFont(title_font, 38)
    c.setFillColorRGB(0.05, 0.1, 0.4)
    c.drawCentredString(width / 2, height - 170, "CERTIFICATE OF COMPLETION")

    c.setFont(body_font, 16)
    c.setFillColor(colors.grey)
    c.drawCentredString(width / 2, height - 200, "This is to certify that")

    c.setFont(title_font, 34)
    c.setFillColor(colors.black)
    c.drawCentredString(width / 2, height - 260, name)

    c.setStrokeColorRGB(0.83, 0.69, 0.22)
    c.setLineWidth(2)
    c.line(width / 2 - 200, height - 270, width / 2 + 200, height - 270)

    c.setFont(body_font, 18)
    c.drawCentredString(width / 2, height - 310, "has successfully completed the course")

    c.setFont(title_font, 22)
    c.setFillColorRGB(0.1, 0.2, 0.6)
    c.drawCentredString(width / 2, height - 345, course)

    _safe_image(c, ASSETS_DIR / "badge.png", width / 2 - 35, height - 440, 70, 70)

    date_str = datetime.now().strftime("%d %B %Y")
    c.setFont(body_font, 12)
    c.setFillColor(colors.black)
    c.drawString(70, 90, f"Certificate ID: {cert_id}")
    c.drawRightString(width - 70, 90, f"Issued on: {date_str}")

    _safe_image(c, ASSETS_DIR / "sign1.png", 130, 150, 200, 90)
    _safe_image(c, ASSETS_DIR / "sign2.png", width - 330, 150, 200, 90)
    c.setFont(body_font, 12)
    c.drawString(140, 130, "Authorized Signature")
    c.drawString(width - 320, 130, "Program Head")

    c.setFont(body_font, 10)
    c.setFillColor(colors.grey)
    c.drawCentredString(
        width / 2,
        55,
        "This certificate is digitally generated and valid without physical signature.",
    )

    c.save()
    return str(file_path), cert_id
