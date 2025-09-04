from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from .config import JWT_SECRET, JWT_ALG

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(raw: str) -> str:
    return pwd.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    return pwd.verify(raw, hashed)

def create_access_token(payload: dict, minutes: int = 60*24*7) -> str:
    to_encode = payload.copy()
    exp = datetime.utcnow() + timedelta(minutes=minutes)
    to_encode.update({"exp": exp})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None
