from fastapi import APIRouter

from app.services.legacy_live_interview_service import end_live_interview, start_live_interview, submit_live_answer


router = APIRouter(prefix="/live-interview", tags=["legacy"])


@router.post("/start")
def start(data: dict):
    return start_live_interview(data)


@router.post("/submit")
def submit(data: dict):
    return submit_live_answer(data)


@router.post("/end")
def end(data: dict):
    return end_live_interview(data)
