import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayEvents, getUpcomingEvents } from '../../utils/api';
import { format, parseISO } from 'date-fns';
import Card from '../common/Card';
import Button from '../common/Button';
import styles from './CalendarPage.module.css';

function formatEventTime(event) {
  try {
    if (event.start?.dateTime) return format(parseISO(event.start.dateTime), 'EEE d MMM · h:mm a');
    if (event.start?.date)     return format(parseISO(event.start.date), 'EEE d MMM · All day');
  } catch {}
  return '';
}

function formatDuration(event) {
  try {
    if (!event.start?.dateTime || !event.end?.dateTime) return '';
    const mins = (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000;
    return mins >= 60 ? `${Math.round(mins/60)}h` : `${mins}m`;
  } catch { return ''; }
}

export default function CalendarPage() {
  const { state } = useApp();
  const { googleAccessToken, user } = state;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('upcoming');

  useEffect(() => {
    if (!googleAccessToken) return;
    fetchEvents();
  }, [googleAccessToken, view]);

  async function fetchEvents() {
    setLoading(true); setError('');
    try {
      const fn = view === 'today' ? getTodayEvents : getUpcomingEvents;
      const { events: evts } = await fn(googleAccessToken);
      setEvents(evts);
    } catch (e) {
      setError(e.message || 'Could not load calendar events. Your Google token may have expired — try signing out and back in.');
    }
    setLoading(false);
  }

  if (!googleAccessToken) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Google Calendar</h1>
            <p className={styles.sub}>Your events and schedule</p>
          </div>
        </div>
        <div className={styles.notConnected}>
          <div className={styles.notConnectedIcon}>📅</div>
          <h3>Calendar not connected</h3>
          <p>Sign out and sign back in — Google Calendar access is granted automatically during sign-in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Google Calendar</h1>
          <p className={styles.sub}>Connected as {user?.email}</p>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${view==='today'?styles.activeView:''}`} onClick={() => setView('today')}>Today</button>
          <button className={`${styles.viewBtn} ${view==='upcoming'?styles.activeView:''}`} onClick={() => setView('upcoming')}>Upcoming</button>
        </div>
      </div>

      <div className={styles.connected}>✅ Connected · {user?.email}</div>

      {loading && <div className={styles.loading}><div className={styles.spinner} /> Loading events...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className={styles.empty}>No events found for this period</div>
      )}

      <div className={styles.eventList}>
        {events.map((evt, i) => (
          <Card key={i} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <div className={styles.eventDot} />
              <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>{evt.summary || '(No title)'}</div>
                <div className={styles.eventTime}>{formatEventTime(evt)}{formatDuration(evt) && ` · ${formatDuration(evt)}`}</div>
              </div>
            </div>
            {evt.description && <p className={styles.eventDesc}>{evt.description}</p>}
            {evt.location && <p className={styles.eventLoc}>📍 {evt.location}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
