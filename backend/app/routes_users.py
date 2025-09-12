from fastapi import APIRouter, Depends
from bson import ObjectId
from .deps import get_current_user
from .db import users
from .schemas import UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": {
        "id": user["id"], "name": user["name"], "email": user["email"],
        "age": user.get("age"), "sex": user.get("sex"),
        "heightCm": user.get("heightCm"), "weightKg": user.get("weightKg"),
    }}

@router.put("/me")
async def update_me(payload: UserUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    if "sex" in update and update["sex"]:
        update["sex"] = update["sex"].lower()
    if update:
        await users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
        user.update(update)
    return {"user": {
        "id": user["id"], "name": user["name"], "email": user["email"],
        "age": user.get("age"), "sex": user.get("sex"),
        "heightCm": user.get("heightCm"), "weightKg": user.get("weightKg"),
    }}
