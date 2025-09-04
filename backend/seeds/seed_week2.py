# backend/seeds/seed_week2.py
import os, random
from datetime import date, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/predictmedi")
DB_NAME = (MONGO_URI.split("/")[-1].split("?")[0]) or "predictmedi"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def seed(email: str):
    user = db.users.find_one({"email": email.lower()})
    if not user:
        print("User not found:", email)
        return
    uid = str(user["_id"])
    today = date.today()
    # 7 days activity
    for i in range(7):
        d = (today - timedelta(days=i)).isoformat()
        db.activity_logs.insert_one({
            "userId": uid, "date": d,
            "minutes": random.choice([20,30,40,50]),
            "steps": random.choice([3000,5000,7000,9000]),
            "type": random.choice(["walk","run","gym"]),
        })
    # 7 days meals (1 meal each)
    for i in range(7):
        d = (today - timedelta(days=i)).isoformat()
        items = [
            {"name":"Oats", "calories":150, "carbs_g":27, "protein_g":5, "fat_g":3},
            {"name":"Milk", "calories":120, "carbs_g":12, "protein_g":8, "fat_g":5},
        ]
        db.meal_logs.insert_one({
            "userId": uid, "date": d, "items": items,
            "totalCalories": sum(x["calories"] for x in items),
            "notes":"seed",
        })
    print("Seeded 7 days for", email)

if __name__ == "__main__":
    import sys
    if len(sys.argv)<2:
        print("Usage: python seeds/seed_week2.py <email>")
    else:
        seed(sys.argv[1])
