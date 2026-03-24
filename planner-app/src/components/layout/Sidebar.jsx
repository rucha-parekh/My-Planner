import { useApp } from '../../context/AppContext';
import { signOutUser } from '../../utils/firebase';
import styles from './Sidebar.module.css';

const NAV = [
  { section: 'Today' },
  { id: 'today',    label: "Today's Schedule", icon: '☀️' },
  { id: 'ai',       label: 'AI Scheduler',      icon: '✨' },
  { section: 'Manage' },
  { id: 'tasks',    label: 'Tasks',             icon: '✓' },
  { id: 'habits',   label: 'Habits',            icon: '🌱' },
  { id: 'vision',   label: 'Vision Board',      icon: '🎯' },
  { section: 'Connect' },
  { id: 'calendar', label: 'Google Calendar',   icon: '📅' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { currentPage, weather, user, googleAccessToken } = state;

  async function handleSignOut() {
    await signOutUser();
    dispatch({ type: 'SIGN_OUT' });
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1 className={styles.logoTitle}>Planner ✦</h1>
        <p className={styles.logoSub}>Your life, scheduled</p>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) return <div key={i} className={styles.section}>{item.section}</div>;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
              onClick={() => dispatch({ type: 'SET_PAGE', page: item.id })}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Weather widget */}
      <div className={styles.weatherWidget}>
        {weather ? (
          <>
            <div className={styles.weatherTop}>
              <span className={styles.weatherTemp}>{weather.emoji} {weather.temp}°C</span>
              <span className={styles.weatherDesc}>{weather.description}</span>
            </div>
            <div className={styles.weatherGrid}>
              <div className={styles.wStat}><span className={styles.wLabel}>Feels</span><span className={styles.wVal}>{weather.feels_like}°C</span></div>
              <div className={styles.wStat}><span className={styles.wLabel}>Humidity</span><span className={styles.wVal}>{weather.humidity}%</span></div>
              <div className={styles.wStat}><span className={styles.wLabel}>AQI</span><span className={styles.wVal}>{weather.aqi} {weather.aqi_emoji}</span></div>
              <div className={styles.wStat}><span className={styles.wLabel}>Wind</span><span className={styles.wVal}>{weather.wind} km/h</span></div>
            </div>
            <div className={styles.weatherAdvice}>{weather.outdoor_advice}</div>
          </>
        ) : (
          <div className={styles.weatherDesc}>Loading weather...</div>
        )}
        <div className={styles.weatherLocation}>📍 Mumbai</div>
      </div>

      {/* User */}
      {user && (
        <div className={styles.userRow}>
          {user.photoURL && <img src={user.photoURL} className={styles.avatar} alt="" />}
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.displayName?.split(' ')[0]}</div>
            <div className={styles.gcalStatus}>{googleAccessToken ? '📅 Calendar connected' : '📅 Not connected'}</div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">↗</button>
        </div>
      )}
    </aside>
  );
}
