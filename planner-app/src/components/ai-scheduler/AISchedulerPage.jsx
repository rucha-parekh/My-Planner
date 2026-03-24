import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateSchedule } from '../../utils/api';
import { getFirebaseToken } from '../../utils/firebase';
import { categoryColor } from '../../utils/dateUtils';
import Card from '../common/Card';
import Button from '../common/Button';
import styles from './AISchedulerPage.module.css';

const CAT_COLORS = { health:'#7a9e7e', career:'#c9705a', personal:'#8b7ab8', finance:'#b89e5a', spiritual:'#5a8fb8', default:'#a89d94' };

export default function AISchedulerPage() {
  const { state } = useApp();
  const { tasks, weather, googleAccessToken } = state;

  const [wakeTime, setWakeTime] = useState('06:30');
  const [collegeHours, setCollegeHours] = useState('');
  const [energyLevel, setEnergyLevel] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoPush, setAutoPush] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncResult, setSyncResult] = useState(null);

  async function generate() {
    setLoading(true); setError(''); setSchedule([]); setSyncResult(null);
    try {
      const firebaseToken = await getFirebaseToken();
      const payload = {
        tasks,
        wake_time: wakeTime,
        college_hours: collegeHours,
        energy_level: energyLevel,
        custom_prompt: customPrompt,
        weather,
        auto_push: autoPush && !!googleAccessToken,
        google_access_token: googleAccessToken || null,
      };
      const data = await generateSchedule(payload, firebaseToken);
      setSchedule(data.schedule || []);
      if (data.gcal_sync) setSyncResult(data.gcal_sync);
    } catch (e) {
      setError(e.message || 'Something went wrong. Make sure the backend is running.');
    }
    setLoading(false);
  }

  const syncedCount = syncResult?.filter(r => r.success).length || 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Scheduler ✨</h1>
          <p className={styles.sub}>Generates your day and pushes it straight to Google Calendar</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.inputs}>
          <Card>
            <div className={styles.cardTitle}>⚡ Schedule my day</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Anything extra today?</label>
              <textarea className={styles.textarea} value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g. call mom, submit assignment, avoid screen after 9pm... (tasks are auto-included)" rows={3} />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Wake up time</label>
                <input className={styles.input} type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>College / work hours</label>
                <input className={styles.input} value={collegeHours} onChange={e => setCollegeHours(e.target.value)} placeholder="e.g. 9am–1pm" />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Energy level</label>
              <div className={styles.energyBtns}>
                {['low','medium','high'].map(e => (
                  <button key={e} className={`${styles.energyBtn} ${energyLevel===e ? styles.energyActive:''}`} onClick={() => setEnergyLevel(e)}>
                    {e==='low'?'😴 Low':e==='medium'?'😊 Medium':'⚡ High'}
                  </button>
                ))}
              </div>
            </div>

            {weather && (
              <div className={styles.weatherNote}>
                {weather.emoji} {weather.temp}°C · feels like {weather.feels_like}°C · 💧{weather.humidity}% humidity · AQI {weather.aqi} {weather.aqi_emoji}
                <div className={styles.outdoorAdvice}>{weather.outdoor_advice}</div>
              </div>
            )}

            <label className={styles.autoPushRow}>
              <input type="checkbox" checked={autoPush} onChange={e => setAutoPush(e.target.checked)} />
              <span>
                Auto-push to Google Calendar
                {!googleAccessToken && <span className={styles.autoPushNote}> (sign in first)</span>}
              </span>
            </label>

            <Button onClick={generate} disabled={loading} size="lg" style={{ width:'100%', justifyContent:'center', marginTop:12 }}>
              {loading ? '✨ Generating...' : '✨ Generate & Schedule My Day'}
            </Button>
          </Card>

          <Card>
            <div className={styles.cardTitle}>Tasks included ({tasks.filter(t=>!t.done).length})</div>
            <div className={styles.taskPreview}>
              {tasks.filter(t=>!t.done).slice(0,8).map(t => (
                <div key={t.id} className={styles.previewItem}>
                  <div className={styles.previewDot} style={{ background: CAT_COLORS[t.category]||CAT_COLORS.default }} />
                  <span style={{flex:1}}>{t.text}</span>
                  <span className={styles.previewDur}>{t.duration||30}m</span>
                </div>
              ))}
              {tasks.filter(t=>!t.done).length===0 && <p className={styles.noTasks}>No active tasks yet</p>}
            </div>
          </Card>
        </div>

        <div className={styles.output}>
          {loading && (
            <Card className={styles.loadingCard}>
              <div className={styles.spinner} />
              <p>Building your perfect day...</p>
            </Card>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {syncResult && (
            <div className={styles.syncBanner}>
              ✅ {syncedCount} events added to Google Calendar
              {syncResult.filter(r=>!r.success).length > 0 && ` (${syncResult.filter(r=>!r.success).length} failed)`}
            </div>
          )}

          {schedule.length > 0 && (
            <Card>
              <div className={styles.scheduleHeader}>
                <div className={styles.cardTitle}>Your day ✦</div>
                <span className={styles.scheduleCount}>{schedule.length} blocks</span>
              </div>
              <div className={styles.scheduleList}>
                {schedule.map((item, i) => (
                  <div key={i} className={styles.scheduleItem}>
                    <div className={styles.scheduleTime}>{item.time}</div>
                    <div className={styles.scheduleBar} style={{ background: CAT_COLORS[item.category]||CAT_COLORS.default }} />
                    <div className={styles.scheduleInfo}>
                      <div className={styles.scheduleTitle}>{item.title}</div>
                      <div className={styles.scheduleMeta}>
                        {item.duration && <span>{item.duration}m</span>}
                        {item.note && <span> · {item.note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!loading && !schedule.length && !error && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>✨</div>
              <p>Your AI schedule appears here</p>
              <p className={styles.placeholderSub}>It accounts for Mumbai weather, AQI, your tasks, and your energy level — then pushes it to Google Calendar automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
