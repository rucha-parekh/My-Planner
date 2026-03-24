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
    if aqi <= 300: return "Very Unhealthy", "🟣"
    return "Hazardous", "🟤"

def outdoor_advice(temp: float, feels_like: float, aqi: float, code: int) -> str:
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
        # Main weather
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,apparent_temperature,relative_humidity_2m,"
            f"weathercode,windspeed_10m,precipitation"
            f"&timezone=Asia/Kolkata"
        )
        # Air quality
        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            f"&current=us_aqi,pm2_5,pm10"
            f"&timezone=Asia/Kolkata"
        )

        weather_res = await client.get(weather_url)
        aqi_res = await client.get(aqi_url)

        w = weather_res.json()["current"]
        a = aqi_res.json()["current"]

        temp = round(w["temperature_2m"])
        feels_like = round(w["apparent_temperature"])
        humidity = round(w["relative_humidity_2m"])
        code = int(w["weathercode"])
        wind = round(w["windspeed_10m"])
        precip = w.get("precipitation", 0)

        us_aqi = a.get("us_aqi", 0) or 0
        pm25 = round(a.get("pm2_5", 0) or 0, 1)

        desc, emoji = weather_code_desc(code)
        aqi_text, aqi_emoji = aqi_label(us_aqi)
        advice = outdoor_advice(temp, feels_like, us_aqi, code)

        return {
            "temp": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "wind": wind,
            "precipitation": precip,
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
