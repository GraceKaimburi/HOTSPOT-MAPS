import pandas as pd
import firebase_admin
from firebase_admin import storage, firestore
from firebase_config import db, bucket

# 🔹 Change this to the filename you uploaded in Firebase Storage
filename = "Hotspot_Data.xlsx"  # Change to .csv if using CSV
local_path = f"backend/{Hotspot_Data.xlsx}"

# 🔹 Download file from Firebase Storage
blob = bucket.blob(filename)
blob.download_to_filename(local_path)
print(f"✅ Downloaded {filename} from Firebase Storage")

# 🔹 Read the CSV/Excel File
if filename.endswith('.csv'):
    df = pd.read_csv(local_path)
else:
    df = pd.read_excel(local_path)

# 🔹 Convert DataFrame to Firestore format
collection_name = "Hotspot_Data"

for index, row in df.iterrows():
    country_code = row["FID"]  # Ensure this column exists
    
    # Convert row to dictionary
    row_data = row.to_dict()

    # Upload to Firestore
    db.collection(collection_name).document(str(country_code)).set(row_data)

print("✅ Data successfully uploaded to Firestore!")
