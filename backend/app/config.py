import os
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env if present

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/predictmedi")
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME__GENERATE_A_REAL_ONE")
JWT_ALG = "HS256"

DIABETES_API_URL = os.getenv("DIABETES_API_URL", "http://127.0.0.1:8001")