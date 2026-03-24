from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
import httpx
from datetime import datetime, timedelta
import pytz

router = APIRouter()

IST = pytz.timezone("Asia/Kolkata")

class ScheduleRequest(BaseModel):
    tasks: list[dict]
    wake_time: str = "06:30"
    college_hours: str = ""
    energy_level: str = "medium"
    custom_prompt: str = ""
    weather: Optional[dict] = None
    google_access_token: Optional[str] = None  # if provided, auto-push to GCal
    auto_push: bool = False

def build_prompt(req: ScheduleRequest) -> str:
    weather_note = ""
    if req.weather:
        w = req.weather
        weather_note = (
            f"Current Mumbai weather: {w.get('temp')}°C, feels like {w.get('feels_like')}°C, "
            f"humidity {w.get('humidity')}%, AQI {w.get('aqi')} ({w.get('aqi_label')}). "
            f"Outdoor advice: {w.get('outdoor_advice')}"
        )
    else:
        weather_note = "Weather: assume hot Mumbai conditions, avoid afternoon outdoor tasks."

    task_lines = "\n".join([
        f"- \"{t.get('text')}\" ({t.get('category', 'personal')}, {t.get('priority', 'medium')} priority, "
        f"{t.get('duration', 30)} mins, prefer: {t.get('timeOfDay', 'anytime')}"
        f"{', OUTDOOR' if t.get('outdoor') else ''})"
        for t in req.tasks if not t.get("done")
    ]) or "No specific tasks — create a productive default schedule."

    return f"""You are a smart personal scheduler for a final-year CS student in Mumbai.

User info:
- Wake time: {req.wake_time}
- College/work hours: {req.college_hours or "none today"}
- Energy level: {req.energy_level}
- {weather_note}
{f"- Additional notes: {req.custom_prompt}" if req.custom_prompt else ""}

Tasks to schedule:
{task_lines}

Rules:
1. Yoga/exercise ALWAYS in the morning, right after wake-up
2. Deep work (career, finance tasks) in morning peak hours
3. If feels_like > 35°C or AQI > 100 — NO outdoor tasks in afternoon, move to morning or evening
4. Block college hours completely
5. Include 10-15 min breaks between focus blocks
6. Evening: wind down tasks, journalling, reading
7. Be realistic — don't over-schedule

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {{"time": "06:30", "title": "Yoga", "duration": 60, "category": "health", "note": "Start strong"}},
  {{"time": "07:45", "title": "Breakfast + Journal", "duration": 20, "category": "personal", "note": "Mindful morning"}}
]"""

async def push_to_gcal(schedule: list[dict], access_token: str):
    """Push each schedule item to Google Calendar."""
    today = datetime.now(IST).date()
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    results = []

    async with httpx.AsyncClient(timeout=15) as client:
        for item in schedule:
            try:
                h, m = map(int, item["time"].split(":"))
                start_dt = IST.localize(datetime.combine(today, datetime.min.time().replace(hour=h, minute=m)))
                end_dt = start_dt + timedelta(minutes=item.get("duration", 30))

                event = {
                    "summary": item["title"],
                    "description": item.get("note", ""),
                    "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                    "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "Asia/Kolkata"},
                    "colorId": {"health": "2", "career": "6", "personal": "3",
                                "finance": "5", "spiritual": "7"}.get(item.get("category", ""), "1"),
                }

                res = await client.post(
                    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                    headers=headers,
                    json=event,
                )
                results.append({"title": item["title"], "success": res.status_code == 200})
            except Exception as e:
                results.append({"title": item.get("title", "?"), "success": False, "error": str(e)})

    return results

@router.post("")
async def generate_schedule(req: ScheduleRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set in .env")

    client = anthropic.Anthropic(api_key=api_key)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": build_prompt(req)}],
        )
        text = message.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        schedule = json.loads(text.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    gcal_results = None
    if req.auto_push and req.google_access_token:
        gcal_results = await push_to_gcal(schedule, req.google_access_token)

    return {"schedule": schedule, "gcal_sync": gcal_results}
