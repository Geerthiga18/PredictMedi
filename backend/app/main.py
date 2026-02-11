# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib  # To load the trained model
import httpx

from .routes_auth import router as auth_router
from .routes_users import router as users_router
from .routes_activity import router as activity_router
from .routes_meals import router as meals_router
from .routes_nutrition import router as nutrition_router
from .routes_coach import router as coach_router
from .routes_ai import router as ai_router

from .config import DIABETES_API_URL, HEART_API_URL

app = FastAPI(title="PredictMedi Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core app routes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(activity_router)
app.include_router(meals_router)
app.include_router(nutrition_router)
app.include_router(coach_router)
app.include_router(ai_router)

# Load model globally to reuse during requests
model_path = "C:/Users/shang/Desktop/PredictMedi/backend/ml_diabetes/diabetes_model.joblib"
model_screen = joblib.load(model_path)

# Updated to match the exact column names from your training script
class DiabetesScreenFeatures(BaseModel):
    BMI: float
    Age_Group: int  # Changed to use underscore, will map to "Age Group"
    Physical_Activity: int  # Changed to use underscore, will map to "Physical Activity"
    Fruit_Veggie_Consumption: int  # Changed to use underscore, will map to "Fruit/Veggie Consumption"
    Family_History_of_Diabetes: int  # Changed to use underscore
    High_Blood_Pressure: int  # Changed to use underscore
    High_Cholesterol: int  # Changed to use underscore
    Stroke_Heart_Disease_History: int  # Changed to use underscore
    General_Health: int  # Changed to use underscore

    class Config:
        # Allow the frontend to send with spaces, Pydantic will handle conversion
        populate_by_name = True
        
        # Define field aliases so frontend can send either format
        fields = {
            'Age_Group': {'alias': 'Age Group'},
            'Physical_Activity': {'alias': 'Physical Activity'},
            'Fruit_Veggie_Consumption': {'alias': 'Fruit/Veggie Consumption'},
            'Family_History_of_Diabetes': {'alias': 'Family History of Diabetes'},
            'High_Blood_Pressure': {'alias': 'High Blood Pressure'},
            'High_Cholesterol': {'alias': 'High Cholesterol'},
            'Stroke_Heart_Disease_History': {'alias': 'Stroke/Heart Disease History'},
            'General_Health': {'alias': 'General Health'}
        }

class ProxyFeatures(BaseModel):
    features: dict
    top_k: int = None

def risk_bucket(probability: float, model_type: str = "screen"):
    """
    Classify diabetes risk based on probability
    """
    if probability < 0.10:
        return {
            "label": "Very low chance",
            "advice": "Continue maintaining a healthy lifestyle with regular exercise and balanced diet."
        }
    elif probability < 0.25:
        return {
            "label": "Low chance",
            "advice": "Keep up good habits. Consider annual health screenings."
        }
    elif probability < 0.50:
        return {
            "label": "Moderate chance",
            "advice": "Consider lifestyle modifications and consult with your healthcare provider."
        }
    elif probability < 0.75:
        return {
            "label": "High chance",
            "advice": "Strongly recommend consulting a healthcare provider for proper screening and assessment."
        }
    else:
        return {
            "label": "Very high chance",
            "advice": "Please consult with a healthcare provider as soon as possible for comprehensive evaluation."
        }

@app.get("/health")
async def health():
    return {"ok": True}

# ---------- Diabetes screen prediction ----------

@app.post("/ml/diabetes/screen")
async def ml_diabetes_screen(payload: dict):
    try:
        # Extract features from payload
        features_dict = payload.get("features", {})
        
        # Create DataFrame with exact column names that the model expects
        # These must match the columns used during training
        X = pd.DataFrame([{
            "BMI": features_dict.get("BMI"),
            "Age Group": features_dict.get("Age Group"),
            "Physical Activity": features_dict.get("Physical Activity"),
            "Fruit/Veggie Consumption": features_dict.get("Fruit/Veggie Consumption"),
            "Family History of Diabetes": features_dict.get("Family History of Diabetes"),
            "High Blood Pressure": features_dict.get("High Blood Pressure"),
            "High Cholesterol": features_dict.get("High Cholesterol"),
            "Stroke/Heart Disease History": features_dict.get("Stroke/Heart Disease History"),
            "General Health": features_dict.get("General Health"),
        }])

        # Ensure all values are present
        if X.isnull().values.any():
            raise HTTPException(
                status_code=400,
                detail="Missing required features"
            )

        # Prediction
        proba = model_screen.predict_proba(X)[:, 1]  # Probability for diabetes risk (class 1)

        # Risk bucket based on the probability
        risk = risk_bucket(proba[0], "screen")

        return {
            "probability": float(proba[0]),
            "risk": risk,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )

# ---------- Diabetes labs prediction ----------

@app.post("/ml/diabetes/labs")
async def ml_diabetes_labs(payload: ProxyFeatures):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{DIABETES_API_URL}/predict_labs",
                json={"features": payload.features},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"diabetes labs upstream error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"diabetes labs model not available on server: {e}",
        )


# ---------- Heart proxy ----------

@app.post("/ml/heart/predict")
async def ml_heart_predict(payload: ProxyFeatures):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{HEART_API_URL}/predict",
                json={"features": payload.features, "top_k": payload.top_k or 5},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"heart model upstream error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"heart model not available on server: {e}",
        )