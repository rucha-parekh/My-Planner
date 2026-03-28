from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

router = APIRouter()

def init_firebase():
    if firebase_admin._apps:
        return True
    # Try env variable first (for Render hosting)
    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if creds_json:
        try:
            cred_dict = json.loads(creds_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            return True
        except Exception as e:
            print(f"Firebase env init failed: {e}")
    # Fall back to file (for local dev)
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        return True
    return False

def get_db():
    if not init_firebase():
        raise HTTPException(status_code=500, detail="Firebase not configured.")
    return firestore.client()

def verify_token(authorization: str) -> str:
    if not init_firebase():
        raise HTTPException(status_code=500, detail="Firebase not configured.")
    try:
        id_token = authorization.replace("Bearer ", "")
        decoded = auth.verify_id_token(id_token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please sign in again.")

class UserData(BaseModel):
    tasks: Optional[list] = None
    habits: Optional[list] = None
    vision_goals: Optional[dict] = None
    google_access_token: Optional[str] = None
    settings: Optional[dict] = None

class PartialUpdate(BaseModel):
    field: str
    value: Any

@router.get("/data")
async def get_user_data(authorization: str = Header(...)):
    uid = verify_token(authorization)
    db = get_db()
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return {"data": None}
    return {"data": doc.to_dict()}

@router.put("/data")
async def save_user_data(data: UserData, authorization: str = Header(...)):
    uid = verify_token(authorization)
    db = get_db()
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    db.collection("users").document(uid).set(update, merge=True)
    return {"success": True}

@router.patch("/data")
async def patch_user_data(update: PartialUpdate, authorization: str = Header(...)):
    uid = verify_token(authorization)
    db = get_db()
    db.collection("users").document(uid).set({update.field: update.value}, merge=True)
    return {"success": True}
