from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ApiEndpointCreate(BaseModel):
    name: str
    endpoint: str
    method: str = "GET"
    version: str = "v1.0.0"
    owner: str
    category: str
    description: Optional[str] = None


class ApiEndpointUpdate(BaseModel):
    name: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    version: Optional[str] = None
    owner: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ApiEndpointResponse(BaseModel):
    id: int
    name: str
    endpoint: str
    method: str
    version: str
    owner: str
    category: str
    description: Optional[str]
    status: str
    total_requests: int
    error_rate: float
    avg_response_ms: float
    uptime_pct: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiListResponse(BaseModel):
    items: list[ApiEndpointResponse]
    total: int
    page: int
    page_size: int
