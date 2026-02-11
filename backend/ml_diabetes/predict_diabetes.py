# predict_diabetes.py
import joblib
import pandas as pd

# Load the trained model
model = joblib.load('diabetes_model.joblib')

# Example data (replace with real user input or new data)
new_data = {
    'BMI': [30.5],
    'Age Group': [6],
    'Physical Activity': [1],  # Regular
    'Fruit/Veggie Consumption': [1],  # Yes
    'Family History of Diabetes': [1],
    'High Blood Pressure': [0],
    'High Cholesterol': [1],
    'Stroke/Heart Disease History': [0],
    'General Health': [2],  # Good
}

# Convert to DataFrame
new_df = pd.DataFrame(new_data)

# Predict diabetes risk
prediction = model.predict(new_df)
probability = model.predict_proba(new_df)[:, 1]  # Probability of class 1 (diabetes)

print(f"Prediction: {'Diabetes risk' if prediction[0] == 1 else 'No diabetes risk'}")
print(f"Probability of Diabetes: {probability[0]:.2f}")