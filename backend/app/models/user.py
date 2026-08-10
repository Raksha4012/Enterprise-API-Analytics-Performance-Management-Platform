from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database.connection import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    developer = "developer"
    viewer = "viewer"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.viewer)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.active)
    api_access_count: Mapped[int] = mapped_column(Integer, default=0)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
