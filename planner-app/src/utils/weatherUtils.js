// Uses Open-Meteo (free, no API key needed)
export async function fetchWeather(lat = 19.076, lon = 72.8777) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,apparent_temperature&timezone=Asia%2FKolkata`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const apparent = Math.round(data.current.apparent_temperature);
    const code = data.current.weathercode;
    return { temp, apparent, description: weatherCodeToDesc(code), emoji: weatherCodeToEmoji(code) };
  } catch {
    return { temp: null, apparent: null, description: 'Mumbai', emoji: '🌤️' };
  }
}

function weatherCodeToDesc(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rainy';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

function weatherCodeToEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫️';
  if (code <= 69) return '🌧️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌥️';
}

export function isTooHotOutdoor(weather) {
  return weather && weather.temp > 33;
}
