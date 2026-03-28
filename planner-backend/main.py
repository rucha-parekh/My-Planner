from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import credentials
import os
import json
from dotenv import load_dotenv

from routes import weather, schedule, calendar, user

load_dotenv()

# Initialize Firebase once at startup
if not firebase_admin._apps:
    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    if creds_json:
        cred = credentials.Certificate(json.loads(creds_json))
        firebase_admin.initialize_app(cred)
    elif os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://my-planner-491107.web.app",
    "https://my-planner-491107.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(user.router, prefix="/api/user", tags=["user"])

@app.get("/")
def root():
    return {"status": "Planner API running"}