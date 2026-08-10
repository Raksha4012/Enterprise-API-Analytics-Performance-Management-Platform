from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    api_access_count: int
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None


class UserInvite(BaseModel):
    email: EmailStr
    role: str = "viewer"
    message: Optional[str] = None
