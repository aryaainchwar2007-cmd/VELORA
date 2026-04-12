from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    branch: Literal["CS", "IT", "ENTC", "Mechanical"]
    year: Literal["1st", "2nd", "3rd", "4th"]


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=128)


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class AuthStudentOut(BaseModel):
    user_id: str
    email: str
    full_name: str
    username: str
    branch: str
    year: str
    role: str
    created_at: datetime


class AuthResponseOut(BaseModel):
    token: AuthTokenOut
    user: AuthStudentOut
