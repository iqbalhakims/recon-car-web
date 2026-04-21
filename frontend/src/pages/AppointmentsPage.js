import { useState, useEffect } from 'react';
import { authFetch } from '../auth';

const STATUS_COLOR = { scheduled: '#2563eb', completed: '#16a34a', cancelled: '#dc2626' };
const STATUS_BG    = { scheduled: '#dbeafe', completed: '#dcfce7', cancelled: '#fee2e2' };

function Badge({ status }) {
  return (
    <span style={{
      background: STATUS_BG[status] || '#f3f4f6',
      color: STATUS_COLOR[status] || '#374151',
      borderRadius: 20, padding: '3px 10px',
      fontSize: '0.75rem', fontWeight: 700,
    }}>{status}</span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: color || '#1e2d3d' }}>{value}</span>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState([]);
  const [filter, setFilter] = useState('all'); // all | scheduled | completed | cancelled
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const res = await authFetch('/api/appointments');
    const data = await res.json();
    if (data.success) setAppts(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id, status) => {
    await authFetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const deleteAppt = async (id) => {
    await authFetch(`/api/appointments/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const scheduled = appts.filter(a => a.status === 'scheduled');
  const todayAppts = scheduled.filter(a => a.appointment_date?.slice(0, 10) === today);
  const upcoming   = scheduled.filter(a => a.appointment_date?.slice(0, 10) > today);
  const completed  = appts.filter(a => a.status === 'completed');
  const cancelled  = appts.filter(a => a.status === 'cancelled');

  const visible = filter === 'all' ? appts : appts.filter(a => a.status === filter);

  if (loading) return <p style={{ padding: 16, color: '#6b7280' }}>Loading appointments…</p>;

  return (
    <div style={{ marginTop: 20 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Today"     value={todayAppts.length} color="#2563eb" />
        <StatCard label="Upcoming"  value={upcoming.length}   color="#7c3aed" />
        <StatCard label="Completed" value={completed.length}  color="#16a34a" />
        <StatCard label="Cancelled" value={cancelled.length}  color="#dc2626" />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
            borderColor: filter === f ? '#5ba4cf' : '#e5e7eb',
            background: filter === f ? '#5ba4cf' : '#fff',
            color: filter === f ? '#fff' : '#374151',
            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}{f === 'all' ? ` (${appts.length})` : ''}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {visible.length === 0
          ? <p style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af' }}>No appointments found.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Date & Time', 'Customer', 'Phone', 'Car', 'Ref', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a, i) => {
                    const dt = new Date(a.appointment_date);
                    const isToday = a.appointment_date?.slice(0, 10) === today;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6', background: isToday && a.status === 'scheduled' ? '#fffbeb' : '#fff' }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#1e2d3d' }}>{dt.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
                          {isToday && a.status === 'scheduled' && <span style={{ fontSize: '0.68rem', background: '#fef9c3', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>TODAY</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{a.lead_name}</td>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>
                          <a href={`tel:${a.lead_phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{a.lead_phone}</a>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>{a.car_model || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.8rem' }}>{a.car_ref || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><Badge status={a.status} /></td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {a.status === 'scheduled' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'completed')} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid #16a34a', color: '#16a34a', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}>Done</button>
                              <button onClick={() => updateStatus(a.id, 'cancelled')} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid #dc2626', color: '#dc2626', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                            </>
                          )}
                          <button onClick={() => deleteAppt(a.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', color: '#9ca3af', background: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
