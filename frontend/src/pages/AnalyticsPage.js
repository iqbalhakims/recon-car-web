import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

const AWS = {
  dark:     '#232f3e',
  orange:   '#ec7211',
  blue:     '#0073bb',
  border:   '#d5dbdb',
  bg:       '#f2f3f3',
  text:     '#16191f',
  textSub:  '#687078',
  white:    '#ffffff',
  rowHover: '#f8f8f8',
};

/* ─── SVG bar chart ──────────────────────────────────────────────────────── */
function BarChart({ data, height = 160, color = AWS.blue }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AWS.textSub, fontSize: '0.83rem' }}>
        No data available
      </div>
    );
  }

  const W = 600;
  const padL = 36, padR = 8, padT = 10, padB = 36;
  const innerW = W - padL - padR;
  const innerH = height;
  const n = data.length;
  const max = Math.max(...data.map(d => d.visitors), 1);
  const barW = innerW / n;
  const barPad = Math.max(barW * 0.15, 1);
  const yTicks = 4;
  const labelEvery = n <= 14 ? 1 : n <= 31 ? 3 : 7;

  return (
    <svg
      viewBox={`0 0 ${W} ${innerH + padT + padB}`}
      style={{ width: '100%', display: 'block' }}
    >
      {/* grid lines + y labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round(max * (yTicks - i) / yTicks);
        const y = padT + (innerH * i / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e8eaed" strokeWidth={1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fill={AWS.textSub} fontSize={10}>{val}</text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const bh = Math.max((d.visitors / max) * innerH, d.visitors > 0 ? 2 : 0);
        const x = padL + i * barW + barPad / 2;
        const y = padT + innerH - bh;
        const w = barW - barPad;
        const showLabel = i % labelEvery === 0 || i === n - 1;
        const label = d.date.slice(5); // MM-DD

        return (
          <g key={d.date}>
            <rect x={x} y={y} width={Math.max(w, 1)} height={bh} fill={color} opacity={0.85} rx={1} />
            {d.visitors > 0 && bh > 18 && (
              <text x={x + w / 2} y={y - 3} textAnchor="middle" fill={color} fontSize={9} fontWeight="bold">
                {d.visitors}
              </text>
            )}
            {showLabel && (
              <text
                x={x + w / 2}
                y={padT + innerH + 16}
                textAnchor="middle"
                fill={AWS.textSub}
                fontSize={9}
                transform={n > 14 ? `rotate(-40 ${x + w / 2} ${padT + innerH + 16})` : undefined}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* x-axis line */}
      <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke={AWS.border} strokeWidth={1} />
    </svg>
  );
}

/* ─── horizontal bars for trending cars ─────────────────────────────────── */
function HorizontalBars({ cars }) {
  if (!cars || cars.length === 0) {
    return (
      <div style={{ padding: '24px 16px', color: AWS.textSub, fontSize: '0.83rem', textAlign: 'center' }}>
        No trending data yet — views will appear as customers browse cars.
      </div>
    );
  }

  const max = Math.max(...cars.map(c => c.views), 1);
  const rankColors = ['#e67e22', '#7f8c8d', '#b7950b', AWS.blue];

  return (
    <div>
      {cars.map((car, i) => (
        <div key={car.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${AWS.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: rankColors[Math.min(i, 3)], minWidth: 22, fontSize: '0.82rem' }}>
                #{i + 1}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: AWS.text }}>
                  {car.model}{car.year ? ` (${car.year})` : ''}
                </div>
                <div style={{ fontSize: '0.73rem', color: AWS.textSub }}>
                  RM {car.price?.toLocaleString()} · {car.mileage?.toLocaleString()} km
                </div>
              </div>
            </div>
            <span style={{ background: '#e8f5e9', color: '#1d8348', fontWeight: 700, fontSize: '0.8rem', padding: '2px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>
              {car.views?.toLocaleString()} views
            </span>
          </div>
          <div style={{ height: 5, background: '#e8eaed', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(car.views / max) * 100}%`,
              height: '100%',
              background: rankColors[Math.min(i, 3)],
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── shared primitives ──────────────────────────────────────────────────── */
function Widget({ title, action, children }) {
  return (
    <div style={{ background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${AWS.border}`, background: '#fafafa' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: AWS.text }}>{title}</span>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

function PeriodToggle({ periods, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {periods.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)} style={{
          padding: '2px 10px', borderRadius: 3, fontSize: '0.75rem', cursor: 'pointer',
          background: active === p.key ? AWS.blue : 'transparent',
          color: active === p.key ? '#fff' : AWS.blue,
          border: `1px solid ${AWS.blue}`, fontWeight: 600,
        }}>{p.label}</button>
      ))}
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [visitors, setVisitors]       = useState(null);
  const [history, setHistory]         = useState([]);
  const [historyDays, setHistoryDays] = useState('7');
  const [trending, setTrending]       = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [loading, setLoading]         = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchVisitors = useCallback(async () => {
    try {
      const [statsRes, histRes] = await Promise.all([
        authFetch('/api/visitors/stats'),
        authFetch(`/api/visitors/history?days=${historyDays}`),
      ]);
      if (statsRes.ok) { const v = await statsRes.json(); setVisitors(v.data); }
      if (histRes.ok)  { const h = await histRes.json();  setHistory(h.data || []); }
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [historyDays]);

  const fetchTrending = useCallback(async () => {
    setTrendLoading(true);
    try {
      const r = await fetch(`/api/cars/trending?period=${trendPeriod}&limit=10`);
      const d = await r.json();
      if (d.success) setTrending(d.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTrendLoading(false);
    }
  }, [trendPeriod]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);
  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVisitors();
    fetchTrending();
  };

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: AWS.textSub, marginBottom: 2 }}>
            <span style={{ color: AWS.blue }}>Home</span> &gt; Analytics
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: AWS.text }}>Analytics</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: AWS.textSub }}>
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing} style={{
            background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3,
            padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', color: AWS.text,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* ── Visitor summary cards ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: AWS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Visitor Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Today',        value: visitors?.today,      color: AWS.orange },
            { label: 'Last 7 days',  value: visitors?.this_week,  color: '#8e44ad' },
            { label: 'Last 30 days', value: visitors?.this_month, color: AWS.blue },
            { label: 'All time',     value: visitors?.total,      color: AWS.text },
          ].map(m => (
            <div key={m.label} style={{ background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3, padding: '16px 18px', borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: m.color, lineHeight: 1 }}>
                {loading ? '—' : (m.value ?? '0')}
              </div>
              <div style={{ fontSize: '0.78rem', color: AWS.textSub, marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Visitor trend bar chart ── */}
      <div style={{ marginTop: 20 }}>
        <Widget
          title="Visitor Trend"
          action={
            <PeriodToggle
              periods={[{ key: '7', label: '7 Days' }, { key: '30', label: '30 Days' }]}
              active={historyDays}
              onChange={setHistoryDays}
            />
          }
        >
          <div style={{ padding: '16px 16px 8px' }}>
            {loading
              ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AWS.textSub, fontSize: '0.83rem' }}>Loading…</div>
              : <BarChart data={history} height={160} color={AWS.blue} />
            }
          </div>
        </Widget>
      </div>

      {/* ── Trending cars ── */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: AWS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Trending Cars
        </div>
        <Widget
          title="Most Viewed Cars"
          action={
            <PeriodToggle
              periods={[
                { key: 'today',   label: 'Today' },
                { key: '7d',      label: '7 Days' },
                { key: 'alltime', label: 'All Time' },
              ]}
              active={trendPeriod}
              onChange={setTrendPeriod}
            />
          }
        >
          {trendLoading
            ? <div style={{ padding: '20px 16px', color: AWS.textSub, fontSize: '0.83rem' }}>Loading…</div>
            : <HorizontalBars cars={trending} />
          }
        </Widget>
      </div>

    </div>
  );
}
