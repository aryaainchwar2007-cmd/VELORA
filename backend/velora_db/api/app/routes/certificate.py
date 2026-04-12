from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.db import get_collection
from app.security import decode_access_token
from app.services.certificate_service import generate_certificate


router = APIRouter(tags=["certificate"])
bearer_scheme = HTTPBearer(auto_error=False)


class CertificateRequest(BaseModel):
    course: str = Field(min_length=2, max_length=200)


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
    student = get_collection("students").find_one({"user_id": payload["sub"], "role": "student", "is_active": True})
    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return student


@router.post("/generate-certificate")
def create_certificate(payload: CertificateRequest, student: dict = Depends(get_current_student)):
    name = (student.get("full_name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="User profile name not found.")
    file_path, cert_id = generate_certificate(name, payload.course.strip())
    return FileResponse(path=file_path, media_type="application/pdf", filename=f"certificate_{cert_id}.pdf")
