# backend/app/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from .config import MONGO_URI

_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
_db = _client["predictmedi"]  # or use DB_NAME if you added it earlier

users    = _db["users"]
activity = _db["activity_logs"]
meals    = _db["meal_logs"]

async def init_db():
    await _client.server_info()  # fast fail if URI wrong
    await users.create_index("email", unique=True)
    await activity.create_index([("userId", 1), ("date", -1)])
    await meals.create_index([("userId", 1), ("date", -1)])
