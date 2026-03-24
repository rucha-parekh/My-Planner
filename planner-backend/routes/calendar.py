from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime, timedelta
import pytz

router = APIRouter()
IST = pytz.timezone("Asia/Kolkata")

GCAL_BASE = "https://www.googleapis.com/calendar/v3"

async def gcal_get(path: str, access_token: str, params: dict = {}):
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{GCAL_BASE}{path}",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )
        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Google token expired. Please reconnect.")
        res.raise_for_status()
        return res.json()

@router.get("/today")
async def get_today_events(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    now = datetime.now(IST)
    start = now.replace(hour=0, minute=0, second=0).isoformat()
    end   = now.replace(hour=23, minute=59, second=59).isoformat()

    data = await gcal_get("/calendars/primary/events", token, {
        "timeMin": start,
        "timeMax": end,
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": 20,
    })
    return {"events": data.get("items", [])}

@router.get("/upcoming")
async def get_upcoming_events(authorization: str = Header(...), maxResults: int = Query(10)):
    token = authorization.replace("Bearer ", "")
    data = await gcal_get("/calendars/primary/events", token, {
        "timeMin": datetime.now(IST).isoformat(),
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": maxResults,
    })
    return {"events": data.get("items", [])}
