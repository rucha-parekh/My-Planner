from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
import os
from dotenv import load_dotenv

from routes import weather, schedule, calendar, user

import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
