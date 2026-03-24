const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

export function loadGapiScript() {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export function loadGisScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export async function initGapi(clientId) {
  await loadGapiScript();
  await new Promise((res) => window.gapi.load('client', res));
  await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
  gapiInited = true;

  await loadGisScript();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  });
  gisInited = true;
}

export function requestToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Not initialized')); return; }
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp);
      else resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export async function getUpcomingEvents(maxResults = 10) {
  const res = await window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.result.items || [];
}

export async function createCalendarEvent({ title, startTime, endTime, description = '' }) {
  const event = {
    summary: title,
    description,
    start: { dateTime: startTime, timeZone: 'Asia/Kolkata' },
    end:   { dateTime: endTime,   timeZone: 'Asia/Kolkata' },
  };
  const res = await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
  return res.result;
}

export function buildEventFromTask(task, date = new Date()) {
  const timeMap = { morning: 7, afternoon: 13, evening: 18, anytime: 10 };
  const hour = timeMap[task.timeOfDay] || 10;
  const start = new Date(date);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + (task.duration || 30) * 60000);
  return {
    title: task.text,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    description: `Category: ${task.category} | Priority: ${task.priority}`,
  };
}
