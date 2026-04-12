from fastapi import APIRouter, HTTPException

from app.db import get_collection


router = APIRouter(tags=["practice"])


@router.get("/practice-problems/{question_no}")
def get_practice_problem(question_no: int):
    if question_no < 1:
        raise HTTPException(status_code=422, detail="question_no must be >= 1")

    problem = get_collection("practice_problems").find_one(
        {"question_no": question_no, "is_active": True},
        {
            "_id": 0,
            "question_no": 1,
            "problem_code": 1,
            "title": 1,
            "difficulty": 1,
            "problem_statement": 1,
            "test_cases": 1,
            "common_keywords": 1,
            "linked_lesson_orders": 1,
        },
    )
    if not problem:
        raise HTTPException(status_code=404, detail="Practice problem not found")

    return problem
