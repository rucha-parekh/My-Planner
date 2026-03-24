import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/dateUtils';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './VisionPage.module.css';

const CATEGORY_META = {
  career:   { label: 'Career',    emoji: '💼', color: 'var(--accent)' },
  finance:  { label: 'Finance',   emoji: '💰', color: 'var(--gold)' },
  lifestyle:{ label: 'Lifestyle', emoji: '🌿', color: 'var(--accent2)' },
  self:     { label: 'Self',      emoji: '💜', color: 'var(--accent3)' },
  hobbies:  { label: 'Hobbies',   emoji: '🎨', color: 'var(--blue)' },
  misc:     { label: 'Misc',      emoji: '✨', color: 'var(--text2)' },
};

export default function VisionPage() {
  const { state, dispatch } = useApp();
  const { visionGoals } = state;

  const [addGoalModal, setAddGoalModal] = useState(null); // category key
  const [newGoalText, setNewGoalText] = useState('');
  const [addCatModal, setAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('⭐');

  const totalGoals = Object.values(visionGoals).flat().length;
  const doneGoals  = Object.values(visionGoals).flat().filter(g => g.done).length;
  const pct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;

  function addGoal() {
    if (!newGoalText.trim() || !addGoalModal) return;
    dispatch({ type: 'ADD_VISION_GOAL', category: addGoalModal, goal: { id: generateId(), text: newGoalText.trim(), done: false } });
    setNewGoalText(''); setAddGoalModal(null);
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    const key = newCatName.toLowerCase().replace(/\s+/g, '_');
    dispatch({ type: 'ADD_VISION_CATEGORY', key });
    // Store meta locally — for now just uses key as label
    setAddCatModal(false); setNewCatName(''); setNewCatEmoji('⭐');
  }

  function getMeta(cat) {
    return CATEGORY_META[cat] || { label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g,' '), emoji: '📌', color: 'var(--text2)' };
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vision Board</h1>
          <p className={styles.sub}>{doneGoals}/{totalGoals} goals achieved</p>
        </div>
        <Button variant="secondary" onClick={() => setAddCatModal(true)}>+ Category</Button>
      </div>

      {/* Overall progress */}
      <Card className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Overall progress</span>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.progressNote}>
          {pct === 0   ? "Every big achievement starts with a single step 🌱" :
           pct < 30    ? "You're getting started — keep going! 🚀" :
           pct < 60    ? "Real momentum building 🔥" :
           pct < 90    ? "Almost there! You're crushing it ✨" :
                         "Incredible — you did it all! 🎉"}
        </p>
      </Card>

      {/* Goals grid */}
      <div className={styles.grid}>
        {Object.entries(visionGoals).map(([cat, goals]) => {
          const meta = getMeta(cat);
          const catDone = goals.filter(g => g.done).length;
          return (
            <Card key={cat} className={styles.catCard}>
              <div className={styles.catHeader}>
                <div className={styles.catTitle} style={{ color: meta.color }}>
                  <span>{meta.emoji}</span> {meta.label}
                </div>
                <div className={styles.catActions}>
                  <span className={styles.catCount}>{catDone}/{goals.length}</span>
                  <button className={styles.addGoalBtn} onClick={() => setAddGoalModal(cat)} title="Add goal">+</button>
                </div>
              </div>

              <div className={styles.goalList}>
                {goals.length === 0 && (
                  <div className={styles.emptyGoals}>No goals yet — add one ✨</div>
                )}
                {goals.map(goal => (
                  <div
                    key={goal.id}
                    className={`${styles.goal} ${goal.done ? styles.goalDone : ''}`}
                  >
                    <div
                      className={`${styles.goalCheck} ${goal.done ? styles.checked : ''}`}
                      style={goal.done ? { background: meta.color, borderColor: meta.color } : {}}
                      onClick={() => dispatch({ type: 'TOGGLE_VISION_GOAL', category: cat, id: goal.id })}
                    >
                      {goal.done && '✓'}
                    </div>
                    <span
                      className={styles.goalText}
                      onClick={() => dispatch({ type: 'TOGGLE_VISION_GOAL', category: cat, id: goal.id })}
                    >
                      {goal.text}
                    </span>
                    <button
                      className={styles.deleteGoalBtn}
                      onClick={() => dispatch({ type: 'DELETE_VISION_GOAL', category: cat, id: goal.id })}
                      title="Delete"
                    >✕</button>
                  </div>
                ))}
              </div>

              <button className={styles.addGoalInline} onClick={() => setAddGoalModal(cat)}>
                + Add goal
              </button>
            </Card>
          );
        })}
      </div>

      {/* Add goal modal */}
      <Modal open={!!addGoalModal} onClose={() => { setAddGoalModal(null); setNewGoalText(''); }} title={`Add goal to ${getMeta(addGoalModal || '').label}`}>
        <div>
          <label className={styles.label}>Goal</label>
          <input
            className={styles.input}
            value={newGoalText}
            onChange={e => setNewGoalText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="What do you want to achieve?"
            autoFocus
          />
        </div>
        <Button onClick={addGoal}>Add Goal</Button>
      </Modal>

      {/* Add category modal */}
      <Modal open={addCatModal} onClose={() => setAddCatModal(false)} title="New Category">
        <div>
          <label className={styles.label}>Emoji</label>
          <input className={styles.input} value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} maxLength={2} style={{ width: 60 }} />
        </div>
        <div>
          <label className={styles.label}>Category name</label>
          <input
            className={styles.input}
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="e.g. Travel, Education, Social..."
            autoFocus
          />
        </div>
        <Button onClick={addCategory}>Add Category</Button>
      </Modal>
    </div>
  );
}
