from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

router = APIRouter()

# Initialize Firebase only once
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        # Will fail gracefully if not configured
        pass

def get_db():
    if not firebase_admin._apps:
        raise HTTPException(status_code=500, detail="Firebase not configured. Set FIREBASE_CREDENTIALS_PATH in .env")
    return firestore.client()

def verify_token(authorization: str) -> str:
    """Verify Firebase ID token and return uid."""
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

@router.get("/profile")
async def get_profile(authorization: str = Header(...)):
    uid = verify_token(authorization)
    db = get_db()
    doc = db.collection("users").document(uid).get()
    data = doc.to_dict() if doc.exists else {}
    return {
        "uid": uid,
        "settings": data.get("settings", {}),
        "google_access_token": data.get("google_access_token"),
    }
