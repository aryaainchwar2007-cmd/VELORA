from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.services.certificate_service import generate_certificate


router = APIRouter(tags=["legacy"])


@router.post("/generate-certificate")
def create_certificate(name: str, course: str):
    file_path, cert_id = generate_certificate(name, course)
    return FileResponse(path=file_path, media_type="application/pdf", filename=f"certificate_{cert_id}.pdf")
