from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database.connection import get_db
from app.models.api_endpoint import ApiEndpoint
from app.models.user import User
from app.schemas.api_endpoint import (
    ApiEndpointCreate, ApiEndpointUpdate,
    ApiEndpointResponse, ApiListResponse,
)
from app.security.dependencies import get_current_user, require_developer, require_admin

router = APIRouter(prefix="/apis", tags=["API Registry"])


@router.get("", response_model=ApiListResponse)
async def list_apis(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    category: str = Query(""),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(ApiEndpoint)
    if search:
        q = q.where(or_(
            ApiEndpoint.name.ilike(f"%{search}%"),
            ApiEndpoint.endpoint.ilike(f"%{search}%"),
        ))
    if status:
        q = q.where(ApiEndpoint.status == status)
    if category:
        q = q.where(ApiEndpoint.category == category)

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()

    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    items = result.scalars().all()

    return ApiListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{api_id}", response_model=ApiEndpointResponse)
async def get_api(
    api_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(ApiEndpoint).where(ApiEndpoint.id == api_id))
    api = result.scalar_one_or_none()
    if not api:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API not found")
    return api


@router.post("", response_model=ApiEndpointResponse, status_code=status.HTTP_201_CREATED)
async def create_api(
    body: ApiEndpointCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_developer),
):
    api = ApiEndpoint(**body.model_dump())
    db.add(api)
    await db.commit()
    await db.refresh(api)
    return api


@router.patch("/{api_id}", response_model=ApiEndpointResponse)
async def update_api(
    api_id: int,
    body: ApiEndpointUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_developer),
):
    result = await db.execute(select(ApiEndpoint).where(ApiEndpoint.id == api_id))
    api = result.scalar_one_or_none()
    if not api:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(api, field, value)

    await db.commit()
    await db.refresh(api)
    return api


@router.delete("/{api_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api(
    api_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(ApiEndpoint).where(ApiEndpoint.id == api_id))
    api = result.scalar_one_or_none()
    if not api:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API not found")
    await db.delete(api)
    await db.commit()
