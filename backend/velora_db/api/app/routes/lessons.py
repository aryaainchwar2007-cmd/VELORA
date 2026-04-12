from fastapi import APIRouter, HTTPException

from app.db import get_collection


router = APIRouter(tags=["lessons"])


@router.get("/courses/{course_slug}/lessons")
def list_lessons(course_slug: str):
    docs = (
        get_collection("lessons")
        .find({"course_slug": course_slug}, {"_id": 0, "course_slug": 1, "lesson_slug": 1, "title": 1, "order": 1})
        .sort("order", 1)
    )
    lessons = list(docs)
    if not lessons:
        raise HTTPException(status_code=404, detail="No lessons found for this course.")
    return {"course_slug": course_slug, "lessons": lessons}


@router.get("/courses/{course_slug}/lessons/{order}")
def get_lesson(course_slug: str, order: int):
    if order < 1:
        raise HTTPException(status_code=422, detail="Lesson order must be >= 1.")
    lesson = get_collection("lessons").find_one(
        {"course_slug": course_slug, "order": order},
        {"_id": 0, "course_slug": 1, "lesson_slug": 1, "title": 1, "order": 1, "content": 1},
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return lesson
