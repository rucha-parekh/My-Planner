export async function generateSchedule({ tasks, wakeTime, collegeHours, energyLevel, weather, customPrompt }) {
  const weatherNote = weather
    ? `Current weather in Mumbai: ${weather.temp}°C, ${weather.description}. ${weather.temp > 33 ? 'It is very hot — avoid scheduling outdoor tasks in the afternoon.' : 'Weather is reasonable for outdoor activities.'}`
    : 'Weather: assume typical Mumbai weather.';

  const taskList = tasks.filter(t => !t.done).map(t =>
    `- "${t.text}" (${t.category}, ${t.priority} priority, ${t.duration || 30} mins, prefer: ${t.timeOfDay}${t.outdoor ? ', OUTDOOR' : ''})`
  ).join('\n');

  const prompt = `You are a smart personal scheduler. Create a realistic daily schedule.

User info:
- Wake up time: ${wakeTime || '6:30 AM'}
- College/work hours: ${collegeHours || 'none specified'}
- Energy level today: ${energyLevel || 'medium'}
- ${weatherNote}
${customPrompt ? `\nAdditional context: ${customPrompt}` : ''}

Tasks to schedule:
${taskList || 'No tasks yet — suggest a productive default schedule.'}

Rules:
1. Yoga/exercise always in the morning
2. Deep work (career/finance tasks) in peak energy hours (morning or early afternoon)
3. No outdoor tasks if temp > 33°C in afternoon
4. Keep tasks grouped by category when possible
5. Include short breaks between long blocks
6. College hours are blocked — don't schedule anything during them

Return ONLY a JSON array (no markdown, no explanation) like:
[
  { "time": "06:30", "title": "Yoga", "duration": 60, "category": "health", "note": "Start the day right" },
  { "time": "08:00", "title": "Breakfast + Journal", "duration": 30, "category": "personal", "note": "Mindful morning" }
]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}
