from fastapi import APIRouter, Query
import httpx

router = APIRouter()

def weather_code_desc(code: int) -> tuple[str, str]:
    if code == 0: return "Clear sky", "☀️"
    if code <= 3: return "Partly cloudy", "⛅"
    if code <= 49: return "Foggy", "🌫️"
    if code <= 59: return "Drizzle", "🌦️"
    if code <= 69: return "Rainy", "🌧️"
    if code <= 79: return "Snow", "❄️"
    if code <= 82: return "Rain showers", "🌦️"
    if code <= 99: return "Thunderstorm", "⛈️"
    return "Cloudy", "🌥️"

def aqi_label(aqi: float) -> tuple[str, str]:
    if aqi <= 50: return "Good", "🟢"
    if aqi <= 100: return "Moderate", "🟡"
    if aqi <= 150: return "Unhealthy for sensitive groups", "🟠"
    if aqi <= 200: return "Unhealthy", "🔴"
    return "Very Unhealthy", "🟣"

def outdoor_advice(feels_like: float, aqi: float, code: int) -> str:
    reasons = []
    if feels_like > 35: reasons.append(f"feels like {round(feels_like)}°C")
    if aqi > 100: reasons.append("poor air quality")
    if code >= 50: reasons.append("rain/storms")
    if reasons:
        return f"⚠️ Avoid outdoor tasks — {', '.join(reasons)}"
    if feels_like > 30:
        return "🌅 Go out only in morning or after 6pm"
    return "✅ Weather is fine for outdoor tasks"

@router.get("")
async def get_weather(lat: float = Query(19.076), lon: float = Query(72.8777)):
    async with httpx.AsyncClient(timeout=10) as client:
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current_weather=true"
            f"&hourly=relativehumidity_2m,apparent_temperature"
            f"&timezone=Asia/Kolkata"
            f"&forecast_days=1"
        )
        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            f"&current=us_aqi,pm2_5"
            f"&timezone=Asia/Kolkata"
        )

        weather_res = await client.get(weather_url)
        aqi_res = await client.get(aqi_url)

        weather_data = weather_res.json()
        aqi_data = aqi_res.json()

        # current_weather block
        cw = weather_data.get("current_weather", {})
        temp = round(cw.get("temperature", 0))
        code = int(cw.get("weathercode", 0))
        wind = round(cw.get("windspeed", 0))

        # Get feels like and humidity from hourly (first hour = now)
        hourly = weather_data.get("hourly", {})
        feels_like = round(hourly.get("apparent_temperature", [temp])[0])
        humidity = round(hourly.get("relativehumidity_2m", [0])[0])

        # AQI
        aqi_current = aqi_data.get("current", {})
        us_aqi = aqi_current.get("us_aqi", 0) or 0
        pm25 = round(aqi_current.get("pm2_5", 0) or 0, 1)

        desc, emoji = weather_code_desc(code)
        aqi_text, aqi_emoji = aqi_label(us_aqi)
        advice = outdoor_advice(feels_like, us_aqi, code)

        return {
            "temp": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "wind": wind,
            "description": desc,
            "emoji": emoji,
            "aqi": round(us_aqi),
            "aqi_label": aqi_text,
            "aqi_emoji": aqi_emoji,
            "pm25": pm25,
            "outdoor_advice": advice,
            "too_hot": feels_like > 35,
            "bad_aqi": us_aqi > 100,
        }