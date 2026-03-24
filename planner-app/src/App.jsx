import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/auth/LoginPage';
import TodayPage from './components/today/TodayPage';
import TasksPage from './components/tasks/TasksPage';
import HabitsPage from './components/habits/HabitsPage';
import VisionPage from './components/vision/VisionPage';
import CalendarPage from './components/calendar/CalendarPage';
import AISchedulerPage from './components/ai-scheduler/AISchedulerPage';
import styles from './App.module.css';

function AppInner() {
  const { state } = useApp();
  const { currentPage, user, authLoading } = state;

  if (authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const pages = {
    today:    <TodayPage />,
    tasks:    <TasksPage />,
    habits:   <HabitsPage />,
    vision:   <VisionPage />,
    calendar: <CalendarPage />,
    ai:       <AISchedulerPage />,
  };

  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.main}>
        {pages[currentPage] || <TodayPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
