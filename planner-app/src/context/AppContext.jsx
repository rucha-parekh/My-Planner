import { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthChange, getFirebaseToken } from '../utils/firebase';
import { getUserData, saveUserData, getWeather } from '../utils/api';

const AppContext = createContext(null);

const DEFAULT_TASKS = [
  { id: '1', text: 'Message DJ Sanghvi alumni on LinkedIn', category: 'career', priority: 'high', timeOfDay: 'morning', duration: 30, outdoor: false, done: false },
  { id: '2', text: 'Create Peerlist profile', category: 'career', priority: 'high', timeOfDay: 'morning', duration: 45, outdoor: false, done: false },
  { id: '3', text: 'Yoga class', category: 'health', priority: 'high', timeOfDay: 'morning', duration: 60, outdoor: false, done: false },
];
const DEFAULT_HABITS = [
  { id: 'h1', name: 'Yoga / Exercise', emoji: '🧘‍♀️', completedDates: [] },
  { id: 'h2', name: 'Meditate', emoji: '🌸', completedDates: [] },
  { id: 'h3', name: 'Journal', emoji: '📓', completedDates: [] },
  { id: 'h4', name: 'Read', emoji: '📚', completedDates: [] },
  { id: 'h5', name: 'Screen < 2hrs', emoji: '📵', completedDates: [] },
  { id: 'h6', name: 'Drink water', emoji: '💧', completedDates: [] },
];
const DEFAULT_VISION = {
  career:   [{ id: 'v1', text: 'Land a remote/part-time job', done: false }, { id: 'v2', text: 'Start a side business', done: false }, { id: 'v3', text: 'Prompt engineering course', done: false }],
  finance:  [{ id: 'v4', text: 'Learn investing', done: false }, { id: 'v5', text: 'Become financially literate', done: false }],
  lifestyle:[{ id: 'v6', text: 'Wake up early consistently', done: false }, { id: 'v7', text: 'Eat well', done: false }, { id: 'v8', text: 'Clear skin routine', done: false }],
  self:     [{ id: 'v9', text: 'Screen time < 2 hours', done: false }, { id: 'v10', text: 'Daily meditation', done: false }, { id: 'v11', text: 'Deep work practice', done: false }],
  hobbies:  [{ id: 'v12', text: 'Swimming', done: false }, { id: 'v13', text: 'Sewing', done: false }, { id: 'v14', text: 'Morse code', done: false }],
  misc:     [{ id: 'v15', text: 'Win a hackathon before college ends', done: false }],
};

const INITIAL = {
  user: null, firebaseToken: null, googleAccessToken: null, authLoading: true,
  tasks: DEFAULT_TASKS, habits: DEFAULT_HABITS, visionGoals: DEFAULT_VISION,
  currentPage: 'today', weather: null, todayEvents: [], dataLoaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH': return { ...state, user: action.user, firebaseToken: action.firebaseToken, googleAccessToken: action.googleAccessToken || state.googleAccessToken, authLoading: false };
    case 'SIGN_OUT': return { ...INITIAL, authLoading: false };
    case 'LOAD_DATA': return { ...state, ...action.data, dataLoaded: true };
    case 'SET_WEATHER': return { ...state, weather: action.weather };
    case 'SET_TODAY_EVENTS': return { ...state, todayEvents: action.events };
    case 'SET_PAGE': return { ...state, currentPage: action.page };
    case 'SET_GOOGLE_TOKEN': return { ...state, googleAccessToken: action.token };
    case 'ADD_TASK': return { ...state, tasks: [action.task, ...state.tasks] };
    case 'TOGGLE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, done: !t.done } : t) };
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case 'ADD_HABIT': return { ...state, habits: [...state.habits, action.habit] };
    case 'DELETE_HABIT': return { ...state, habits: state.habits.filter(h => h.id !== action.id) };
    case 'EDIT_HABIT': return { ...state, habits: state.habits.map(h => h.id === action.id ? { ...h, ...action.updates } : h) };
    case 'TOGGLE_HABIT_DATE': {
      const habits = state.habits.map(h => {
        if (h.id !== action.id) return h;
        const dates = h.completedDates.includes(action.date) ? h.completedDates.filter(d => d !== action.date) : [...h.completedDates, action.date];
        return { ...h, completedDates: dates };
      });
      return { ...state, habits };
    }
    case 'TOGGLE_VISION_GOAL': {
      const vg = { ...state.visionGoals };
      vg[action.category] = vg[action.category].map(g => g.id === action.id ? { ...g, done: !g.done } : g);
      return { ...state, visionGoals: vg };
    }
    case 'ADD_VISION_GOAL': {
      const vg = { ...state.visionGoals };
      vg[action.category] = [...(vg[action.category] || []), action.goal];
      return { ...state, visionGoals: vg };
    }
    case 'DELETE_VISION_GOAL': {
      const vg = { ...state.visionGoals };
      vg[action.category] = vg[action.category].filter(g => g.id !== action.id);
      return { ...state, visionGoals: vg };
    }
    case 'ADD_VISION_CATEGORY': return { ...state, visionGoals: { ...state.visionGoals, [action.key]: [] } };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const firebaseToken = await firebaseUser.getIdToken();
        dispatch({ type: 'SET_AUTH', user: firebaseUser, firebaseToken });
      } else {
        dispatch({ type: 'SIGN_OUT' });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!state.firebaseToken || state.dataLoaded) return;
    getUserData(state.firebaseToken).then(({ data }) => {
      if (data) {
        dispatch({ type: 'LOAD_DATA', data: {
          tasks: data.tasks || DEFAULT_TASKS,
          habits: data.habits || DEFAULT_HABITS,
          visionGoals: data.vision_goals || DEFAULT_VISION,
          googleAccessToken: data.google_access_token || null,
        }});
      } else {
        dispatch({ type: 'LOAD_DATA', data: {} });
      }
    }).catch(() => dispatch({ type: 'LOAD_DATA', data: {} }));
  }, [state.firebaseToken]);

  useEffect(() => {
    getWeather().then(w => dispatch({ type: 'SET_WEATHER', weather: w })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!state.firebaseToken || !state.dataLoaded) return;
    const t = setTimeout(() => {
      getFirebaseToken().then(token => {
        if (token) saveUserData({ tasks: state.tasks, habits: state.habits, vision_goals: state.visionGoals, google_access_token: state.googleAccessToken }, token).catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [state.tasks, state.habits, state.visionGoals, state.googleAccessToken, state.dataLoaded]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
