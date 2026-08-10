from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserInvite
from app.security.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserResponse])
async def list_users(
    search: str = Query(""),
    role: str = Query(""),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(User)
    if search:
        q = q.where(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        q = q.where(User.role == role.lower())
    result = await db.execute(q.order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.delete(user)
    await db.commit()


@router.post("/invite", status_code=status.HTTP_202_ACCEPTED)
async def invite_user(
    body: UserInvite,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # In production: generate a signed invitation token and send email via SES/SendGrid.
    return {"message": f"Invitation sent to {body.email}", "role": body.role}
