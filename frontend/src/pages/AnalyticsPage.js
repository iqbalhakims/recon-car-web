import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../auth';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:       '#0f1623',
  card:     '#1e2130',
  border:   '#2a2f45',
  text:     '#e2e8f0',
  sub:      '#64748b',
  muted:    '#475569',
  blue:     '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.15)',
  green:    '#10b981',
  orange:   '#f59e0b',
  purple:   '#8b5cf6',
  red:      '#ef4444',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return n == null ? '—' : Number(n).toLocaleString(); }
function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
function Tooltip({ x, y, W, content }) {
  if (!content) return null;
  const tipW = 120;
  const left = x + tipW > W - 8 ? x - tipW - 8 : x + 12;
  return (
    <foreignObject x={left} y={Math.max(y - 36, 4)} width={tipW} height={52}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{
        background: '#1e2130', border: '1px solid #3b82f6', borderRadius: 7,
        padding: '6px 10px', pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}>
        <div style={{ color: '#94a3b8', fontSize: 10 }}>{content.date}</div>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{fmt(content.visitors)} visitors</div>
      </div>
    </foreignObject>
  );
}

// ── Line Chart ─────────────────────────────────────────────────────────────────
function LineChart({ data, height = 200 }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: 13 }}>
      No data available
    </div>
  );

  const W = 600;
  const padL = 40, padR = 12, padT = 16, padB = 40;
  const iW = W - padL - padR;
  const iH = height - padT - padB;
  const n = data.length;
  const max = Math.max(...data.map(d => d.visitors), 1);
  const yTicks = 4;
  const labelEvery = n <= 10 ? 1 : n <= 20 ? 2 : 5;

  const px = (i) => padL + (i / (n - 1)) * iW;
  const py = (v) => padT + iH - (v / max) * iH;

  // Build smooth SVG path using cubic bezier
  const points = data.map((d, i) => [px(i), py(d.visitors)]);
  const pathD = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px0, py0] = points[i - 1];
    const cpx = (px0 + x) / 2;
    return acc + ` C ${cpx} ${py0}, ${cpx} ${y}, ${x} ${y}`;
  }, '');

  // Area path (closed)
  const areaD = pathD + ` L ${px(n - 1)} ${padT + iH} L ${px(0)} ${padT + iH} Z`;

  const gradId = 'vg';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${height}`}
      style={{ width: '100%', display: 'block', overflow: 'visible' }}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines + y labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round(max * (yTicks - i) / yTicks);
        const y = padT + (iH * i / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              stroke={i === yTicks ? C.border : '#1e2a3a'} strokeWidth={i === yTicks ? 1.5 : 1} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fill={C.muted} fontSize={10}>{val}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Hover hit areas + dots */}
      {data.map((d, i) => {
        const x = px(i);
        const y = py(d.visitors);
        const isHov = hovered === i;
        return (
          <g key={d.date}>
            {/* Vertical hover line */}
            {isHov && (
              <line x1={x} y1={padT} x2={x} y2={padT + iH} stroke={C.blue} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            )}
            {/* Dot */}
            <circle
              cx={x} cy={y} r={isHov ? 5 : 3}
              fill={isHov ? '#fff' : C.blue}
              stroke={C.blue} strokeWidth={2}
              style={{ transition: 'r 0.1s' }}
            />
            {/* Invisible hit area */}
            <rect
              x={x - iW / n / 2} y={padT} width={iW / n} height={iH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % labelEvery !== 0 && i !== n - 1) return null;
        return (
          <text key={d.date} x={px(i)} y={padT + iH + 20}
            textAnchor="middle" fill={C.muted} fontSize={10}>
            {fmtDate(d.date)}
          </text>
        );
      })}

      {/* Tooltip */}
      {hovered !== null && (
        <Tooltip
          x={px(hovered)}
          y={py(data[hovered].visitors)}
          W={W}
          content={{ date: fmtDate(data[hovered].date), visitors: data[hovered].visitors }}
        />
      )}
    </svg>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────────
function BarChart({ data, height = 200 }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: 13 }}>
      No data available
    </div>
  );

  const W = 600;
  const padL = 40, padR = 12, padT = 16, padB = 40;
  const iW = W - padL - padR;
  const iH = height - padT - padB;
  const n = data.length;
  const max = Math.max(...data.map(d => d.visitors), 1);
  const yTicks = 4;
  const labelEvery = n <= 10 ? 1 : n <= 20 ? 2 : 5;
  const barW = iW / n;
  const barPad = Math.max(barW * 0.18, 2);
  const px = (i) => padL + i * barW;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', display: 'block' }} onMouseLeave={() => setHovered(null)}>
      {/* Grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round(max * (yTicks - i) / yTicks);
        const y = padT + (iH * i / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              stroke={i === yTicks ? C.border : '#1e2a3a'} strokeWidth={i === yTicks ? 1.5 : 1} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fill={C.muted} fontSize={10}>{val}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bh = Math.max((d.visitors / max) * iH, d.visitors > 0 ? 2 : 0);
        const x = px(i) + barPad / 2;
        const y = padT + iH - bh;
        const w = barW - barPad;
        const isHov = hovered === i;

        return (
          <g key={d.date}>
            <rect x={x} y={y} width={Math.max(w, 1)} height={bh}
              fill={isHov ? '#60a5fa' : C.blue}
              opacity={isHov ? 1 : 0.8} rx={3}
              style={{ transition: 'fill 0.1s' }}
            />
            {isHov && d.visitors > 0 && (
              <text x={x + w / 2} y={y - 5} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight="700">
                {d.visitors}
              </text>
            )}
            {i % labelEvery === 0 || i === n - 1 ? (
              <text x={x + w / 2} y={padT + iH + 18}
                textAnchor="middle" fill={C.muted} fontSize={10}>
                {fmtDate(d.date)}
              </text>
            ) : null}
            <rect
              x={x} y={padT} width={w} height={iH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          </g>
        );
      })}

      {/* Tooltip */}
      {hovered !== null && (
        <Tooltip
          x={px(hovered) + barPad / 2 + (barW - barPad) / 2}
          y={padT + iH - (data[hovered].visitors / max) * iH}
          W={W}
          content={{ date: fmtDate(data[hovered].date), visitors: data[hovered].visitors }}
        />
      )}
    </svg>
  );
}

// ── Sparkline (mini) ───────────────────────────────────────────────────────────
function Sparkline({ data, color = C.blue, height = 40 }) {
  if (!data || data.length < 2) return null;
  const W = 100;
  const max = Math.max(...data.map(d => d.visitors), 1);
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * W,
    height - (d.visitors / max) * height,
  ]);
  const d = pts.reduce((acc, [x, y], i) => i === 0 ? `M${x},${y}` : acc + ` L${x},${y}`, '');
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: 80, height: 36, opacity: 0.7 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ── Trending cars ──────────────────────────────────────────────────────────────
function TrendingBars({ cars }) {
  if (!cars || cars.length === 0) return (
    <div style={{ padding: '32px 16px', color: C.sub, fontSize: 13, textAlign: 'center' }}>
      No trending data yet — views will appear as customers browse cars.
    </div>
  );

  const max = Math.max(...cars.map(c => c.views), 1);
  const rankColors = [C.orange, C.sub, '#b7950b', C.blue, C.purple];

  return (
    <div>
      {cars.map((car, i) => (
        <div key={car.id} style={{
          padding: '12px 18px',
          borderBottom: i < cars.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontWeight: 800, fontSize: 13,
                color: rankColors[Math.min(i, rankColors.length - 1)],
                minWidth: 24,
              }}>#{i + 1}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                  {car.model}{car.year ? ` (${car.year})` : ''}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                  RM {car.price?.toLocaleString()} · {car.mileage?.toLocaleString()} km
                </div>
              </div>
            </div>
            <span style={{
              background: 'rgba(16,185,129,0.12)', color: C.green,
              fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20,
              whiteSpace: 'nowrap',
            }}>
              {car.views?.toLocaleString()} views
            </span>
          </div>
          <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(car.views / max) * 100}%`, height: '100%',
              background: rankColors[Math.min(i, rankColors.length - 1)],
              borderRadius: 3, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared widgets ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
      {action && <div>{action}</div>}
    </div>
  );
}

function PeriodToggle({ periods, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: '#151929', borderRadius: 6, padding: 3 }}>
      {periods.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)} style={{
          padding: '4px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontWeight: 600,
          background: active === p.key ? C.blue : 'transparent',
          color: active === p.key ? '#fff' : C.sub,
          border: 'none', transition: 'all 0.15s',
        }}>{p.label}</button>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [visitors,      setVisitors]      = useState(null);
  const [history,       setHistory]       = useState([]);
  const [historyDays,   setHistoryDays]   = useState('30');
  const [trending,      setTrending]      = useState([]);
  const [trendPeriod,   setTrendPeriod]   = useState('7d');
  const [loading,       setLoading]       = useState(true);
  const [trendLoading,  setTrendLoading]  = useState(true);
  const [chartType,     setChartType]     = useState('line'); // 'line' | 'bar'
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [refreshing,    setRefreshing]    = useState(false);

  const fetchVisitors = useCallback(async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        authFetch('/api/visitors/stats'),
        authFetch(`/api/visitors/history?days=${historyDays}`),
      ]);
      if (sRes.ok) { const v = await sRes.json(); setVisitors(v.data); }
      if (hRes.ok) { const h = await hRes.json(); setHistory(h.data || []); }
      setLastUpdated(new Date());
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
    } finally {
      setTrendLoading(false);
    }
  }, [trendPeriod]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);
  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  const handleRefresh = () => { setRefreshing(true); fetchVisitors(); fetchTrending(); };

  // Compute week-over-week change
  const weekChange = (() => {
    if (history.length < 14) return null;
    const thisWeek = history.slice(-7).reduce((s, d) => s + d.visitors, 0);
    const lastWeek = history.slice(-14, -7).reduce((s, d) => s + d.visitors, 0);
    if (lastWeek === 0) return null;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  })();

  const peakDay = history.length
    ? history.reduce((best, d) => d.visitors > best.visitors ? d : best, history[0])
    : null;

  const avgVisitors = history.length
    ? Math.round(history.reduce((s, d) => s + d.visitors, 0) / history.length)
    : 0;

  const summaryCards = [
    { label: 'Today',        value: visitors?.today,      color: C.orange,  icon: '📅' },
    { label: 'Last 7 days',  value: visitors?.this_week,  color: C.purple,  icon: '📈' },
    { label: 'Last 30 days', value: visitors?.this_month, color: C.blue,    icon: '🗓️' },
    { label: 'All time',     value: visitors?.total,      color: C.green,   icon: '🌐' },
  ];

  return (
    <div style={{ paddingBottom: 60 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>
            <span style={{ color: C.blue }}>Home</span> › Analytics
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Analytics</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: C.sub }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: C.text,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none', fontSize: 14 }}>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {summaryCards.map(m => (
          <Card key={m.label} style={{ borderTop: `3px solid ${m.color}` }}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: m.color, lineHeight: 1 }}>
                    {loading ? '—' : fmt(m.value)}
                  </div>
                </div>
                <span style={{ fontSize: 22, opacity: 0.7 }}>{m.icon}</span>
              </div>
              {/* sparkline on 30-day history */}
              {!loading && history.length > 1 && m.label === 'Last 7 days' && (
                <div style={{ marginTop: 10 }}>
                  <Sparkline data={history.slice(-7)} color={m.color} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Insight strip ── */}
      {!loading && (weekChange !== null || peakDay) && (
        <div style={{
          display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap',
        }}>
          {weekChange !== null && (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>{weekChange >= 0 ? '📈' : '📉'}</span>
              <div>
                <div style={{ fontSize: 11, color: C.sub }}>Week-over-week</div>
                <div style={{ fontWeight: 700, color: weekChange >= 0 ? C.green : C.red, fontSize: 15 }}>
                  {weekChange >= 0 ? '+' : ''}{weekChange}%
                </div>
              </div>
            </div>
          )}
          {peakDay && peakDay.visitors > 0 && (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <div style={{ fontSize: 11, color: C.sub }}>Peak day ({historyDays}d)</div>
                <div style={{ fontWeight: 700, color: C.orange, fontSize: 15 }}>
                  {fmtDate(peakDay.date)} — {fmt(peakDay.visitors)} visitors
                </div>
              </div>
            </div>
          )}
          {avgVisitors > 0 && (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <div>
                <div style={{ fontSize: 11, color: C.sub }}>Daily average ({historyDays}d)</div>
                <div style={{ fontWeight: 700, color: C.blue, fontSize: 15 }}>
                  {fmt(avgVisitors)} visitors/day
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Visitor trend chart ── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title="Visitor Trend"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Chart type toggle */}
              <div style={{ display: 'flex', gap: 3, background: '#151929', borderRadius: 6, padding: 3 }}>
                {[['line', '〰'], ['bar', '▐▌']].map(([type, icon]) => (
                  <button key={type} onClick={() => setChartType(type)} style={{
                    padding: '4px 10px', borderRadius: 5, fontSize: 13, cursor: 'pointer',
                    background: chartType === type ? C.card : 'transparent',
                    color: chartType === type ? C.text : C.sub,
                    border: chartType === type ? `1px solid ${C.border}` : '1px solid transparent',
                  }}>{icon}</button>
                ))}
              </div>
              <PeriodToggle
                periods={[{ key: '7', label: '7D' }, { key: '30', label: '30D' }, { key: '90', label: '90D' }]}
                active={historyDays}
                onChange={setHistoryDays}
              />
            </div>
          }
        />
        <div style={{ padding: '20px 16px 12px' }}>
          {loading
            ? <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: 13 }}>Loading…</div>
            : chartType === 'line'
              ? <LineChart data={history} height={220} />
              : <BarChart data={history} height={220} />
          }
        </div>

        {/* Mini daily breakdown table (last 7 days) */}
        {!loading && history.length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 18px' }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Recent daily breakdown
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {history.slice(-7).map(d => {
                const pct = Math.max(...history.slice(-7).map(x => x.visitors), 1);
                return (
                  <div key={d.date} style={{
                    background: '#151929', borderRadius: 7, padding: '8px 12px',
                    border: `1px solid ${C.border}`, minWidth: 74, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{fmtDate(d.date)}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: d.visitors > 0 ? C.blue : C.muted }}>
                      {fmt(d.visitors)}
                    </div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${(d.visitors / pct) * 100}%`, height: '100%', background: C.blue, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Trending cars ── */}
      <Card>
        <CardHeader
          title="Most Viewed Cars"
          action={
            <PeriodToggle
              periods={[{ key: 'today', label: 'Today' }, { key: '7d', label: '7 Days' }, { key: 'alltime', label: 'All Time' }]}
              active={trendPeriod}
              onChange={setTrendPeriod}
            />
          }
        />
        {trendLoading
          ? <div style={{ padding: '24px', color: C.sub, fontSize: 13 }}>Loading…</div>
          : <TrendingBars cars={trending} />
        }
      </Card>
    </div>
  );
}
