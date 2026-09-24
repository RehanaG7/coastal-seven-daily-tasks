from datetime import datetime
from typing import Generic, TypeVar
from pydantic import BaseModel, Field
from models.task import TaskPriority, TaskStatus
from schemas.auth import UserResponse

T = TypeVar("T")


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: datetime | None = None
    assignee_id: int | None = None


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    assignee_id: int | None = None


class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime | None = None
    assignee: UserResponse | None = None

    class Config:
        from_attributes = True


class PaginatedTasksResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[TaskResponse]