import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.celery_app import send_task_assignment_notification
from core.redis_client import get_cache, invalidate_cache_pattern, set_cache
from database import get_db
from models.project import Project
from models.task import Task, TaskPriority, TaskStatus
from models.user import User
from routers.deps import get_current_user
from schemas.task import (
    PaginatedTasksResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not permitted to add tasks to this project"
        )

    assignee_email = None
    if task_in.assignee_id:
        assignee = db.query(User).filter(User.id == task_in.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee user not found")
        assignee_email = assignee.email

    new_task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        project_id=task_in.project_id,
        assignee_id=task_in.assignee_id,
        due_date=task_in.due_date,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Invalidate cached task listings
    invalidate_cache_pattern("tasks:*")

    # Trigger background notification via Celery
    if assignee_email:
        send_task_assignment_notification.delay(
            new_task.id, assignee_email, new_task.title
        )

    return new_task


@router.get("", response_model=PaginatedTasksResponse)
def list_tasks(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    assignee_id: Optional[int] = Query(None, description="Filter by assignee user ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Cache key unique to the user, role, filters, and page coordinates
    cache_key = f"tasks:{current_user.id}:{current_user.role}:{project_id}:{status}:{assignee_id}:{page}:{page_size}"
    cached_result = get_cache(cache_key)
    if cached_result:
        return cached_result

    query = db.query(Task)

    if current_user.role != "admin":
        user_project_ids = [
            p.id
            for p in db.query(Project.id).filter(Project.owner_id == current_user.id).all()
        ]
        query = query.filter(
            (Task.project_id.in_(user_project_ids)) | (Task.assignee_id == current_user.id)
        )

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)

    total_items = query.count()
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1
    skip = (page - 1) * page_size

    tasks = query.offset(skip).limit(page_size).all()

    # Serialize items for Pydantic and caching
    items_data = [TaskResponse.model_validate(t).model_dump() for t in tasks]
    result_data = {
        "total": total_items,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items_data,
    }

    # Cache with a 60-second TTL
    set_cache(cache_key, result_data, ttl_seconds=60)

    return result_data


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role != "admin":
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if (
            project and project.owner_id != current_user.id
        ) and task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this task")

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    invalidate_cache_pattern("tasks:*")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role != "admin":
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project and project.owner_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Only project owner or admin can delete tasks"
            )

    db.delete(task)
    db.commit()

    invalidate_cache_pattern("tasks:*")
    return None