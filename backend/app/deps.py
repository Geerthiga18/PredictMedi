from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .auth import decode_token
from .db import users
from bson import ObjectId

bearer = HTTPBearer(auto_error=False)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds or not creds.scheme.lower() == "bearer":
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    uid = payload.get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    doc = await users.find_one({"_id": ObjectId(uid)})
    if not doc:
        raise HTTPException(status_code=401, detail="User not found")
    # normalize
    doc["id"] = str(doc["_id"])
    return doc
