import { useEffect, useState } from 'react';

interface Stat {
  label: string;
  value: string;
  unit?: string;
  variant?: 'alarm' | 'eco';
  dot?: boolean;
}

export function TopBar() {
  const [livePower, setLivePower] = useState(2847);
  const [todayMwh, setTodayMwh] = useState(32.4);

  useEffect(() => {
    const id = setInterval(() => {
      const wobble = Math.sin(Date.now() / 2000) * 80 + (Math.random() * 30 - 15);
      setLivePower(Math.max(0, Math.round(2847 + wobble)));
      setTodayMwh(v => +(v + 0.001).toFixed(3));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const stats: Stat[] = [
    { label: 'PLANTS',     value: '5' },
    { label: 'CAPACITY',   value: '7.488', unit: 'MWp' },
    { label: 'LIVE POWER', value: livePower.toLocaleString(), unit: 'kW' },
    { label: 'TODAY',      value: todayMwh.toFixed(2), unit: 'MWh' },
    { label: 'ALARMS',     value: '2',     variant: 'alarm', dot: true },
    { label: 'CO₂ SAVED',  value: '1,642', unit: 't', variant: 'eco' },
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-glyph">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e5e5e7" />
                <stop offset="100%" stopColor="#52525b" />
              </linearGradient>
              <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="11" height="11" rx="3" fill="url(#g1)" />
            <rect x="18" y="3" width="11" height="11" rx="3" fill="url(#g2)" opacity=".85" />
            <rect x="3" y="18" width="11" height="11" rx="3" fill="#52525b" opacity=".55" />
            <rect x="18" y="18" width="11" height="11" rx="3" fill="url(#g1)" opacity=".95" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">iRun Workbench</div>
          <div className="brand-sub">International Landing Plants · MY-Region · v3.46.1</div>
        </div>
      </div>

      <div className="topbar-stats">
        {stats.map(s => (
          <div key={s.label} className={`stat ${s.variant || ''}`}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">
              {s.value}
              {s.unit && <span className="stat-unit">{s.unit}</span>}
            </span>
            {s.dot && <span className="alarm-dot" />}
          </div>
        ))}
      </div>

      <div className="topbar-utils">
        <button className="util-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a1.9 1.9 0 0 1-3.4 0" /></svg>
          <span className="notif-dot" />
        </button>
        <button className="util-btn" title="Language">EN</button>
        <div className="user-chip">
          <div className="user-avatar">H</div>
          <div className="user-meta">
            <div className="user-name">hunter</div>
            <div className="user-role">Operations Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
}
