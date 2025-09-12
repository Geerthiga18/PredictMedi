from fastapi import APIRouter, HTTPException
from .schemas import RegisterIn, LoginIn, TokenOut
from .db import users
from .auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenOut, status_code=201)
async def register(payload: RegisterIn):
    if await users.find_one({"email": payload.email.lower()}):
        raise HTTPException(status_code=409, detail="Email already in use")

    doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "passwordHash": hash_password(payload.password),
        "age": payload.age,
       "sex": (payload.sex or "other").lower(), 
        "heightCm": payload.heightCm,
        "weightKg": payload.weightKg,
    }
    res = await users.insert_one(doc)

    user = {
        "id": str(res.inserted_id),
        "name": doc["name"],
        "email": doc["email"],
        "age": doc.get("age"),
        "sex": doc.get("sex", "other"),
        "heightCm": doc.get("heightCm"),
        "weightKg": doc.get("weightKg"),
    }
    token = create_access_token({"id": user["id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": user}

@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn):
    doc = await users.find_one({"email": payload.email.lower()})
    if not doc or not verify_password(payload.password, doc.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "age": doc.get("age"),
        "sex": doc.get("sex", "other"),
        "heightCm": doc.get("heightCm"),
        "weightKg": doc.get("weightKg"),
    }
    token = create_access_token({"id": user["id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": user}
