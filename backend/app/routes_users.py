from fastapi import APIRouter, Depends
from .deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "age": user.get("age"),
            "sex": user.get("sex"),
            "heightCm": user.get("heightCm"),
            "weightKg": user.get("weightKg"),
        }
    }
