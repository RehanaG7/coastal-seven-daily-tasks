from fastapi import APIRouter, Depends
from models.user import UserDB
from schemas.auth import UserResponse
from routers.deps import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Protected User Operations"])

# 1. Open to ANY authenticated user
@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: UserDB = Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    return current_user

# 2. Restricted ONLY to users with role="admin"
@router.get("/admin/dashboard")
def admin_only_route(admin_user: UserDB = Depends(require_admin)):
    """Only reachable if role == 'admin'. Otherwise returns 403 Forbidden."""
    return {
        "message": f"Welcome Admin {admin_user.username}!",
        "secret_data": "Server metrics: All systems operational."
    }