# routes_users.py
from fastapi import APIRouter, Depends
from bson import ObjectId
from .deps import get_current_user
from .db import users
from .schemas import UserUpdate  # make sure this includes the fields below

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def me(user=Depends(get_current_user)):
    # always return the latest stored values
    return {
        "user": {
            "id": user["id"],
            "name": user.get("name"),
            "email": user.get("email"),
            "age": user.get("age"),
            "sex": user.get("sex"),
            "heightCm": user.get("heightCm"),
            "weightKg": user.get("weightKg"),
            "goal": user.get("goal", "maintain"),
            "calorieTarget": user.get("calorieTarget"),
        }
    }


@router.put("/me")
async def update_me(payload: UserUpdate, user=Depends(get_current_user)):
    # works for both Pydantic v1/v2 if your schema exposes model_dump, otherwise use .dict
    try:
        data = payload.model_dump(exclude_unset=True)
    except AttributeError:
        data = payload.dict(exclude_unset=True)

    update = {k: v for k, v in data.items() if v is not None}

    if "sex" in update and update["sex"]:
        update["sex"] = update["sex"].lower()
        if update["sex"] not in ("male", "female", "other"):
            update["sex"] = "other"

    if "goal" in update and update["goal"]:
        g = update["goal"].lower()
        update["goal"] = g if g in ("maintain", "lose", "gain") else "maintain"

    if update:
        await users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
        user.update(update)

    return {
        "user": {
            "id": user["id"],
            "name": user.get("name"),
            "email": user.get("email"),
            "age": user.get("age"),
            "sex": user.get("sex"),
            "heightCm": user.get("heightCm"),
            "weightKg": user.get("weightKg"),
            "goal": user.get("goal", "maintain"),
            "calorieTarget": user.get("calorieTarget"),
        }
    }
