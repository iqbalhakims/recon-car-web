import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './public.css';

const STATUS_COLOR = {
  scheduled: { bg: '#e0f2fe', color: '#0369a1' },
  completed:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626' },
};

export default function CustomerProfilePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/customer/${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.message || 'Profile not found.');
      })
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="pub-layout">
        <header className="pub-header">
          <div className="pub-header-inner">
            <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          </div>
        </header>
        <main className="pub-main" style={{ maxWidth: 560, textAlign: 'center', paddingTop: 80 }}>
          <p style={{ color: '#999' }}>Loading your profile…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pub-layout">
        <header className="pub-header">
          <div className="pub-header-inner">
            <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          </div>
        </header>
        <main className="pub-main" style={{ maxWidth: 560, textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔍</div>
          <h2 style={{ color: '#1e2d3d', marginBottom: 8 }}>Profile Not Found</h2>
          <p style={{ color: '#888' }}>{error}</p>
          <button className="btn-book" style={{ marginTop: 20, maxWidth: 200 }} onClick={() => navigate('/')}>
            Back to Cars
          </button>
        </main>
      </div>
    );
  }

  const { lead, appointments } = data;
  const upcoming = appointments.filter(a => a.status === 'scheduled');
  const past = appointments.filter(a => a.status !== 'scheduled');

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <button className="back-btn" onClick={() => navigate('/')}>← Cars</button>
          <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem' }}>My Profile</span>
        </div>
      </header>

      <main className="pub-main" style={{ maxWidth: 560 }}>

        {/* Profile card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2d3d, #2a4a6b)',
          borderRadius: 14, padding: '24px 24px 20px',
          marginBottom: 24, color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#c9a84c', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#1e2d3d',
              flexShrink: 0,
            }}>
              {lead.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{lead.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>{lead.phone}</div>
              {lead.email && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{lead.email}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Total Bookings</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{appointments.length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Upcoming</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{upcoming.length}</div>
            </div>
            {lead.car_model && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', flex: 2, minWidth: 160 }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Interested In</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{lead.car_model}</div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming appointments */}
        <h3 style={{ color: '#1e2d3d', margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>
          Upcoming Appointments {upcoming.length > 0 && <span style={{ color: '#5ba4cf' }}>({upcoming.length})</span>}
        </h3>

        {upcoming.length === 0 ? (
          <div style={{ background: '#f7f8fa', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '0.9rem', marginBottom: 24 }}>
            No upcoming appointments.{' '}
            <button className="pub-link-btn" onClick={() => navigate('/book')}>Book one now</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} />)}
          </div>
        )}

        {/* Past appointments */}
        {past.length > 0 && (
          <>
            <h3 style={{ color: '#1e2d3d', margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>
              Past Appointments
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {past.map(appt => <AppointmentCard key={appt.id} appt={appt} />)}
            </div>
          </>
        )}

        {/* Book again */}
        <button className="btn-book" onClick={() => navigate('/book')}>
          Book Another Appointment
        </button>

        <p style={{ color: '#bbb', fontSize: '0.75rem', marginTop: 16, textAlign: 'center' }}>
          Bookmark this page to track your appointments anytime.
        </p>

      </main>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const style = STATUS_COLOR[appt.status] || STATUS_COLOR.scheduled;
  const dt = new Date(appt.appointment_date).toLocaleString('en-MY', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur',
  });

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px 18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex',
      flexDirection: 'column', gap: 8, border: '1px solid #f0f0f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e2d3d' }}>{dt}</span>
        <span style={{
          background: style.bg, color: style.color,
          fontSize: '0.72rem', fontWeight: 700,
          padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
        }}>
          {appt.status}
        </span>
      </div>
      {appt.notes && (
        <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{appt.notes}</p>
      )}
    </div>
  );
}
