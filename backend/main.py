from fastapi import FastAPI
import pandas as pd
import firebase_admin
from firebase_admin import firestore
from firebase_config import get_firestore_collection

app = FastAPI()
collection = get_firestore_collection()

# ✅ Load data from Excel and store in Firebase
@app.get("/upload_excel")
def upload_excel():
    df = pd.read_excel("data.xlsx")  # 🔹 Replace with your actual file
    data = df.to_dict(orient="records")
    
    # Save data to Firebase
    for record in data:
        country_code = record.get("Country_Code")  # Ensure column exists
        if country_code:
            collection.document(country_code).set(record)
    
    return {"message": "Data uploaded successfully"}

# ✅ Retrieve country data
@app.get("/api/data/{country_code}")
def get_country_data(country_code: str):
    doc = collection.document(country_code).get()
    if doc.exists:
        return doc.to_dict()
    return {"error": "Data not found"}
