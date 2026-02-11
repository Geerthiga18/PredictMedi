# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load the dataset
file_path = 'C:/Users/shang/Desktop/PredictMedi/backend/ml_diabetes/data/diabetes_dataset.csv' 
df = pd.read_csv(file_path)

# Data Preprocessing
age_group_map = {
    "18-24": 1, "25-29": 2, "30-34": 3, "35-39": 4, "40-44": 5, 
    "45-49": 6, "50-54": 7, "55-59": 8, "60-64": 9, "65-69": 10,
    "70-74": 11, "75-79": 12, "80 or older": 13
}
df['Age Group'] = df['Age Group'].map(age_group_map)

df['Physical Activity'] = df['Physical Activity'].apply(lambda x: 1 if x == 'Regular' else 0)
df['Fruit/Veggie Consumption'] = df['Fruit/Veggie Consumption'].apply(lambda x: 1 if x == 'Yes' else 0)

general_health_map = {
    'Excellent': 1, 'Good': 2, 'Fair': 3, 'Poor': 4
}
df['General Health'] = df['General Health'].map(general_health_map)

yes_no_columns = [
    'Family History of Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Stroke/Heart Disease History'
]
for col in yes_no_columns:
    df[col] = df[col].apply(lambda x: 1 if x == 'Yes' else 0)

# Define features (X) and target (y)
X = df.drop(columns=['Diabetes (Target)'])
y = df['Diabetes (Target)']

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize the Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)

# Train the model
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(y_test, y_pred)
class_report = classification_report(y_test, y_pred)

# Print the results
print(f"Accuracy: {accuracy}")
print(f"Classification Report: \n{class_report}")

# Save the model to a file
joblib.dump(model, 'diabetes_model.joblib')
print("Model saved as 'diabetes_model.joblib'")