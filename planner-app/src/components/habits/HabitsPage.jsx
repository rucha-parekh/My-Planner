import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getMonthDays, formatDate, todayStr, formatMonth, generateId } from '../../utils/dateUtils';
import { format } from 'date-fns';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import styles from './HabitsPage.module.css';

export default function HabitsPage() {
  const { state, dispatch } = useApp();
  const { habits } = state;
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');

  const monthDays = getMonthDays();
  const today = todayStr();

  function addHabit() {
    if (!newName.trim()) return;
    dispatch({ type: 'ADD_HABIT', habit: { id: generateId(), name: newName.trim(), emoji: newEmoji, completedDates: [] } });
    setNewName(''); setNewEmoji('⭐'); setModalOpen(false);
  }

  function getStreak(habit) {
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = formatDate(d);
      if (habit.completedDates.includes(key)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  function getMonthCount(habit) {
    const prefix = format(new Date(), 'yyyy-MM');
    return habit.completedDates.filter(d => d.startsWith(prefix)).length;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Habits</h1>
          <p className={styles.sub}>{formatMonth()} — track what sticks</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Habit</Button>
      </div>

      <div className={styles.habitList}>
        {habits.map(habit => {
          const streak = getStreak(habit);
          const monthCount = getMonthCount(habit);
          return (
            <Card key={habit.id} className={styles.habitCard}>
              <div className={styles.habitHeader}>
                <div className={styles.habitInfo}>
                  <span className={styles.habitEmoji}>{habit.emoji}</span>
                  <span className={styles.habitName}>{habit.name}</span>
                </div>
                <div className={styles.habitStats}>
                  {streak > 0 && <span className={styles.streak}>🔥 {streak} day streak</span>}
                  <span className={styles.monthCount}>{monthCount}/{monthDays.length} this month</span>
                </div>
              </div>

              {/* Month grid */}
              <div className={styles.dotGrid}>
                {monthDays.map(d => {
                  const key = formatDate(d);
                  const done = habit.completedDates.includes(key);
                  const isToday = key === today;
                  const future = key > today;
                  return (
                    <button
                      key={key}
                      disabled={future}
                      className={`${styles.dot} ${done ? styles.done : ''} ${isToday ? styles.todayDot : ''} ${future ? styles.future : ''}`}
                      onClick={() => dispatch({ type: 'TOGGLE_HABIT_DATE', id: habit.id, date: key })}
                      title={format(d, 'MMM d')}
                    >
                      {format(d, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Month bar */}
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(monthCount / monthDays.length) * 100}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Habit">
        <div className={styles.formGroup}>
          <label className={styles.label}>Emoji</label>
          <input className={styles.input} value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="⭐" maxLength={2} style={{ width: 60 }} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Habit name</label>
          <input
            className={styles.input}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            placeholder="e.g. Meditate, Read, Exercise..."
          />
        </div>
        <Button onClick={addHabit}>Add Habit</Button>
      </Modal>
    </div>
  );
}
