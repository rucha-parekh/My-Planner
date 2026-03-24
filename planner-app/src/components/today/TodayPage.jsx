import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { greet, getWeekDays, formatDate, todayStr, buildDaySchedule, priorityBorder } from '../../utils/dateUtils';
import { getTodayEvents } from '../../utils/api';
import { format, parseISO } from 'date-fns';
import Card from '../common/Card';
import Chip from '../common/Chip';
import Button from '../common/Button';
import styles from './TodayPage.module.css';

function formatTime(event) {
  try {
    if (event.start?.dateTime) return format(parseISO(event.start.dateTime), 'HH:mm');
    return 'All day';
  } catch { return ''; }
}

function formatDuration(event) {
  try {
    if (!event.start?.dateTime || !event.end?.dateTime) return '';
    const diff = (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000;
    return `${diff}m`;
  } catch { return ''; }
}

export default function TodayPage() {
  const { state, dispatch } = useApp();
  const { tasks, habits, weather, googleAccessToken, todayEvents } = state;
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState('');

  const weekDays = getWeekDays(7);
  const taskSchedule = buildDaySchedule(tasks, weather);
  const doneTasks = tasks.filter(t => t.done).length;
  const todayHabitsDone = habits.filter(h => h.completedDates.includes(todayStr())).length;

  useEffect(() => {
    if (!googleAccessToken) return;
    setGcalLoading(true);
    getTodayEvents(googleAccessToken)
      .then(({ events }) => dispatch({ type: 'SET_TODAY_EVENTS', events }))
      .catch(() => setGcalError('Could not load calendar events'))
      .finally(() => setGcalLoading(false));
  }, [googleAccessToken]);

  const hasCalendarEvents = todayEvents.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{greet()} ✦</h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Button onClick={() => dispatch({ type: 'SET_PAGE', page: 'tasks' })}>+ Add Task</Button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { num: tasks.length, label: 'Total Tasks' },
          { num: doneTasks, label: 'Completed' },
          { num: todayHabitsDone, label: 'Habits Done' },
          { num: `${Math.round((doneTasks / Math.max(tasks.length, 1)) * 100)}%`, label: 'Progress' },
        ].map(({ num, label }) => (
          <Card key={label} className={styles.statCard}>
            <div className={styles.statNum}>{num}</div>
            <div className={styles.statLabel}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Week strip */}
      <div className={styles.weekStrip}>
        {weekDays.map(d => {
          const isToday = formatDate(d) === todayStr();
          return (
            <div key={d.toISOString()} className={`${styles.dayChip} ${isToday ? styles.today : ''}`}>
              <div className={styles.dayName}>{format(d, 'EEE')}</div>
              <div className={styles.dayNum}>{format(d, 'd')}</div>
            </div>
          );
        })}
      </div>

      {/* Google Calendar events */}
      {googleAccessToken && (
        <>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>📅 From Google Calendar</div>
            {gcalLoading && <span className={styles.loading}>Loading...</span>}
          </div>
          {gcalError && <div className={styles.gcalError}>{gcalError}</div>}
          {!gcalLoading && !gcalError && todayEvents.length === 0 && (
            <div className={styles.gcalEmpty}>No events in Google Calendar today</div>
          )}
          {hasCalendarEvents && (
            <div className={styles.blocks} style={{ marginBottom: 24 }}>
              {todayEvents.map((evt, i) => (
                <div key={i} className={styles.block} style={{ borderLeft: '3px solid #4285f4' }}>
                  <div className={styles.blockTime}>{formatTime(evt)}</div>
                  <div className={styles.blockContent}>
                    <div className={styles.blockTitle}>{evt.summary || '(No title)'}</div>
                    <div className={styles.blockMeta}>
                      <span className={styles.gcalBadge}>📅 Google Calendar</span>
                      {formatDuration(evt) && <span className={styles.duration}>{formatDuration(evt)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!googleAccessToken && (
        <div className={styles.gcalPrompt}>
          <span>📅 Sign in with Google to see your calendar here</span>
        </div>
      )}

      {/* Task schedule */}
      <div className={styles.sectionTitle}>✓ Tasks to do today</div>
      {taskSchedule.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌸</div>
          <p>No tasks yet —{' '}
            <button className={styles.emptyLink} onClick={() => dispatch({ type: 'SET_PAGE', page: 'tasks' })}>add tasks</button>
            {' '}or{' '}
            <button className={styles.emptyLink} onClick={() => dispatch({ type: 'SET_PAGE', page: 'ai' })}>let AI schedule your day</button>
          </p>
        </div>
      ) : (
        <div className={styles.blocks}>
          {taskSchedule.map(task => (
            <div
              key={task.id}
              className={`${styles.block} ${task.done ? styles.done : ''}`}
              style={{ borderLeft: `3px solid ${priorityBorder(task.priority)}` }}
            >
              <div className={styles.blockTime}>{task.displayTime}</div>
              <div className={styles.blockContent}>
                <div className={styles.blockTitle}>{task.text}</div>
                <div className={styles.blockMeta}>
                  <Chip category={task.category} label={task.category} />
                  {task.duration && <span className={styles.duration}>{task.duration}m</span>}
                  {task.outdoor && <span>🌳 outdoor</span>}
                </div>
              </div>
              <button
                className={`${styles.checkBtn} ${task.done ? styles.checked : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_TASK', id: task.id })}
              >{task.done ? '✓' : ''}</button>
            </div>
          ))}
        </div>
      )}

      {/* Habits today */}
      <div className={styles.sectionTitle} style={{ marginTop: 28 }}>Today's Habits</div>
      <div className={styles.habitsRow}>
        {habits.map(h => {
          const done = h.completedDates.includes(todayStr());
          return (
            <button
              key={h.id}
              className={`${styles.habitBtn} ${done ? styles.habitDone : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_HABIT_DATE', id: h.id, date: todayStr() })}
            >
              <span>{h.emoji}</span>
              <span className={styles.habitName}>{h.name}</span>
              {done && <span className={styles.tick}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
