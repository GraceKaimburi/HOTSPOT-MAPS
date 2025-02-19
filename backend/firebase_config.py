import firebase_admin
from firebase_admin import credentials, firestore

# Load Firebase service account key
cred = credentials.Certificate("backend/firebase-key.json") 
firebase_admin.initialize_app(cred)

# Firestore Database
db = firestore.client()

def get_firestore_collection():
    return db.collection("gender-hotspot-data")

# =======

import firebase_admin
from firebase_admin import credentials, firestore, storage

# Load Firebase credentials from your service account key file
cred = credentials.Certificate("backend/serviceAccountKey.json")  # Ensure this exists
firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-project-id.appspot.com'  # Change to your actual Firebase project
})

# Initialize Firestore and Storage
db = firestore.client()
bucket = storage.bucket()
