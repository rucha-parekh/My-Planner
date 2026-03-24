import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateId, categoryColor, priorityBorder } from '../../utils/dateUtils';
import Card from '../common/Card';
import Chip from '../common/Chip';
import Button from '../common/Button';
import styles from './TasksPage.module.css';

const CATEGORIES = ['career', 'health', 'personal', 'finance', 'spiritual'];
const PRIORITIES = ['high', 'medium', 'low'];
const TIMES = ['morning', 'afternoon', 'evening', 'anytime'];

const CATEGORY_EMOJI = { career: '💼', health: '🌿', personal: '💜', finance: '💰', spiritual: '✨' };
const PRIORITY_EMOJI = { high: '🔴', medium: '🟡', low: '🟢' };
const TIME_EMOJI = { morning: '🌅', afternoon: '☀️', evening: '🌆', anytime: '⏰' };

export default function TasksPage() {
  const { state, dispatch } = useApp();
  const { tasks } = state;

  const [text, setText] = useState('');
  const [category, setCategory] = useState('career');
  const [priority, setPriority] = useState('high');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [outdoor, setOutdoor] = useState(false);
  const [filter, setFilter] = useState('all');

  function addTask() {
    if (!text.trim()) return;
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: generateId(),
        text: text.trim(),
        category,
        priority,
        timeOfDay,
        duration: duration ? parseInt(duration) : 30,
        dueDate: dueDate || null,
        outdoor,
        done: false,
      },
    });
    setText(''); setDuration(''); setDueDate(''); setOutdoor(false);
  }

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'done') return t.done;
    if (filter === 'active') return !t.done;
    return t.category === filter || t.priority === filter;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.sub}>{tasks.filter(t => !t.done).length} remaining · {tasks.filter(t => t.done).length} done</p>
        </div>
      </div>

      {/* Add task */}
      <Card className={styles.addCard}>
        <div className={styles.inputRow}>
          <input
            className={styles.textInput}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="What do you need to do?"
          />
          <Button onClick={addTask}>Add</Button>
        </div>
        <div className={styles.metaRow}>
          <select value={category} onChange={e => setCategory(e.target.value)} className={styles.select}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} className={styles.select}>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_EMOJI[p]} {p}</option>)}
          </select>
          <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} className={styles.select}>
            {TIMES.map(t => <option key={t} value={t}>{TIME_EMOJI[t]} {t}</option>)}
          </select>
          <input
            className={styles.select}
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="mins"
            style={{ width: 80 }}
          />
          <input
            className={styles.select}
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          <label className={styles.outdoorLabel}>
            <input type="checkbox" checked={outdoor} onChange={e => setOutdoor(e.target.checked)} />
            outdoor?
          </label>
        </div>
      </Card>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'active', 'done', ...CATEGORIES, 'high'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'high' ? '🔴 high priority' : f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No tasks here yet ✨</div>
        )}
        {filtered.map(task => (
          <div
            key={task.id}
            className={`${styles.taskItem} ${task.done ? styles.done : ''}`}
            style={{ borderLeft: `3px solid ${priorityBorder(task.priority)}` }}
          >
            <button
              className={`${styles.checkbox} ${task.done ? styles.checked : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_TASK', id: task.id })}
            >
              {task.done ? '✓' : ''}
            </button>
            <div className={styles.taskContent}>
              <div className={styles.taskText}>{task.text}</div>
              <div className={styles.taskMeta}>
                <Chip category={task.category} label={task.category} />
                <span className={styles.metaTag}>{TIME_EMOJI[task.timeOfDay]} {task.timeOfDay}</span>
                {task.duration && <span className={styles.metaTag}>⏱ {task.duration}m</span>}
                {task.dueDate && <span className={styles.metaTag}>📅 {task.dueDate}</span>}
                {task.outdoor && <span className={styles.metaTag}>🌳 outdoor</span>}
              </div>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
