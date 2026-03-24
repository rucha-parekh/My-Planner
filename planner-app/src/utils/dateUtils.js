import { format, addDays, startOfMonth, getDaysInMonth, isToday, parseISO } from 'date-fns';

export const today = () => new Date();
export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export function getWeekDays(count = 7) {
  return Array.from({ length: count }, (_, i) => addDays(new Date(), i - 1));
}

export function getMonthDays(date = new Date()) {
  const start = startOfMonth(date);
  const total = getDaysInMonth(date);
  return Array.from({ length: total }, (_, i) => addDays(start, i));
}

export function formatDate(date) {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplay(date) {
  return format(date, 'EEE d');
}

export function formatMonth(date = new Date()) {
  return format(date, 'MMMM yyyy');
}

export function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function timeSlotLabel(slot) {
  const map = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌆 Evening', anytime: '⏰ Anytime' };
  return map[slot] || slot;
}

export function categoryColor(cat) {
  const map = {
    career:   { bg: 'rgba(201,112,90,0.12)',  text: 'var(--accent)' },
    health:   { bg: 'rgba(122,158,126,0.12)', text: 'var(--accent2)' },
    personal: { bg: 'rgba(139,122,184,0.12)', text: 'var(--accent3)' },
    finance:  { bg: 'rgba(184,158,90,0.12)',  text: 'var(--gold)' },
    spiritual:{ bg: 'rgba(90,143,184,0.12)',  text: 'var(--blue)' },
  };
  return map[cat] || { bg: 'var(--surface2)', text: 'var(--text2)' };
}

export function priorityBorder(p) {
  const map = { high: 'var(--accent)', medium: 'var(--gold)', low: 'var(--accent2)' };
  return map[p] || 'var(--border)';
}

export function buildDaySchedule(tasks, weather) {
  const slotOrder = ['morning', 'afternoon', 'evening', 'anytime'];
  const filtered = tasks
    .filter(t => !t.done)
    .filter(t => {
      if (t.outdoor && weather) {
        const temp = weather.temp;
        if (temp > 33 && t.timeOfDay === 'afternoon') return false;
      }
      return true;
    });

  const times = { morning: '06:30', afternoon: '13:00', evening: '18:00', anytime: '20:00' };
  return slotOrder
    .flatMap(slot => filtered.filter(t => t.timeOfDay === slot).map(t => ({ ...t, displayTime: times[slot] })));
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}
