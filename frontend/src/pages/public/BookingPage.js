import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './public.css';

const LABEL = {
  '09:00': '9:00 AM', '10:00': '10:00 AM', '11:00': '11:00 AM',
  '12:00': '12:00 PM', '13:00': '1:00 PM', '14:00': '2:00 PM',
  '15:00': '3:00 PM', '16:00': '4:00 PM', '17:00': '5:00 PM',
};
const ALL_SLOTS = Object.keys(LABEL);

function today() {
  return new Date().toISOString().slice(0, 10);
}

const STEPS = ['Your Details', 'Date & Time', 'Review'];

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preCarId = searchParams.get('car_id') || '';

  const [car, setCar] = useState(null);
  const [step, setStep] = useState(0); // 0, 1, 2

  // Step 0 — customer details
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  // Step 1 — date/time
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState({ available: ALL_SLOTS, booked: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { profile_token, profile_url, appointment_date }

  useEffect(() => {
    if (!preCarId) return;
    fetch('/api/cars')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(c => c.id === parseInt(preCarId));
          if (found) setCar(found);
        }
      });
  }, [preCarId]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    fetch(`/api/appointments/available?date=${date}`)
      .then(r => r.json())
      .then(data => { if (data.success) setSlots(data.data); })
      .finally(() => setLoadingSlots(false));
  }, [date]);

  // ── Step 0 → 1 validation
  function handleStep0(e) {
    e.preventDefault();
    setError('');
    if (!/^01[0-9]{8,9}$/.test(form.phone)) {
      return setError('Enter a valid Malaysian phone number (e.g. 0123456789).');
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError('Enter a valid email address.');
    }
    setStep(1);
  }

  // ── Step 1 → 2 validation
  function handleStep1(e) {
    e.preventDefault();
    setError('');
    if (!selectedSlot) return setError('Please select a time slot.');
    setStep(2);
  }

  // ── Step 2 → submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const appointment_date = `${date}T${selectedSlot}:00`;
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          notes: form.notes || undefined,
          car_id: preCarId || undefined,
          appointment_date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDone({
          profile_token: data.data.profile_token,
          profile_url: data.data.profile_url,
          appointment_date,
        });
      } else {
        setError(data.message);
        if (res.status === 409) {
          fetch(`/api/appointments/available?date=${date}`)
            .then(r => r.json())
            .then(d => { if (d.success) setSlots(d.data); });
          setSelectedSlot('');
          setStep(1);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen
  if (done) {
    const dt = new Date(`${date}T${selectedSlot}`).toLocaleString('en-MY', {
      dateStyle: 'full', timeStyle: 'short',
    });
    return (
      <div className="pub-layout">
        <header className="pub-header">
          <div className="pub-header-inner">
            <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          </div>
        </header>
        <main className="pub-main" style={{ maxWidth: 480, textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1e2d3d', marginBottom: 8 }}>Appointment Booked!</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>
            We'll contact you at <strong>{form.phone}</strong> to confirm your visit on{' '}
            <strong>{dt}</strong>.
          </p>
          {form.email && (
            <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 24 }}>
              A confirmation has been sent to <strong>{form.email}</strong>.
            </p>
          )}
          <a
            href={done.profile_url || `/profile/${done.profile_token}`}
            style={{
              display: 'inline-block', background: '#1e2d3d', color: 'white',
              padding: '13px 28px', borderRadius: 10, fontWeight: 700,
              textDecoration: 'none', marginBottom: 14, fontSize: '0.95rem',
            }}
          >
            View My Profile & Appointments
          </a>
          <br />
          <button
            className="btn-book"
            style={{ marginTop: 8, background: 'transparent', color: '#5ba4cf', border: '1px solid #5ba4cf', fontSize: '0.9rem', padding: '10px 24px' }}
            onClick={() => navigate('/')}
          >
            Back to Cars
          </button>
        </main>
      </div>
    );
  }

  const appointmentDatetime = selectedSlot
    ? new Date(`${date}T${selectedSlot}`).toLocaleString('en-MY', { dateStyle: 'full', timeStyle: 'short' })
    : null;

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <button className="back-btn" onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}>← Back</button>
          <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem' }}>Book a Visit</span>
        </div>
      </header>

      <main className="pub-main" style={{ maxWidth: 560 }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 0 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                  background: i < step ? '#22c55e' : i === step ? '#1e2d3d' : '#e5e7eb',
                  color: i <= step ? 'white' : '#999',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: i === step ? '#1e2d3d' : '#aaa', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? '#22c55e' : '#e5e7eb', margin: '0 6px', marginBottom: 18 }} />
              )}
            </div>
          ))}
        </div>

        {/* Car preview */}
        {car && (
          <div style={{ background: '#eef3f7', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a93a8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Interested in</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e2d3d' }}>{car.model}{car.year ? ` (${car.year})` : ''}</span>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#555' }}>
              {car.ref_no && <span>Ref: <strong>{car.ref_no}</strong></span>}
              <span>RM <strong>{car.price?.toLocaleString()}</strong></span>
            </div>
          </div>
        )}

        {/* ── STEP 0: Your Details ── */}
        {step === 0 && (
          <form onSubmit={handleStep0} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ color: '#1e2d3d', margin: '0 0 4px' }}>Your Details</h2>
            <p style={{ color: '#888', margin: '0 0 8px', fontSize: '0.9rem' }}>Tell us who you are so we can confirm your booking.</p>

            <div className="book-field">
              <label>Full Name</label>
              <input placeholder="e.g. Ahmad Razif" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="book-field">
              <label>Phone Number</label>
              <input placeholder="e.g. 0123456789" required value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
              <span className="book-hint">We'll use this to confirm your appointment.</span>
            </div>

            <div className="book-field">
              <label>Email <span style={{ fontWeight: 400, color: '#aaa' }}>(optional — get a confirmation email)</span></label>
              <input type="email" placeholder="e.g. ahmad@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="book-field">
              <label>Notes <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
              <textarea placeholder="Any specific questions or requests?" rows={3} value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {error && <div className="book-error">{error}</div>}

            <button type="submit" className="btn-book">Next: Pick Date & Time →</button>
          </form>
        )}

        {/* ── STEP 1: Date & Time ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ color: '#1e2d3d', margin: '0 0 4px' }}>Date & Time</h2>
            <p style={{ color: '#888', margin: '0 0 8px', fontSize: '0.9rem' }}>Each slot is 1 hour, first-come first-served.</p>

            <div className="book-field">
              <label>Select Date</label>
              <input type="date" value={date} min={today()}
                onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="book-field">
              <label>Select Time {loadingSlots && <span style={{ color: '#aaa', fontWeight: 400 }}>(loading…)</span>}</label>
              <div className="slot-grid">
                {ALL_SLOTS.map(slot => {
                  const taken = slots.booked.includes(slot);
                  const active = selectedSlot === slot;
                  return (
                    <button key={slot} type="button"
                      className={`slot-btn${taken ? ' taken' : active ? ' selected' : ''}`}
                      disabled={taken} onClick={() => setSelectedSlot(slot)}>
                      {LABEL[slot]}
                      {taken && <span className="slot-taken-label">Taken</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="book-error">{error}</div>}

            <button type="submit" className="btn-book">Next: Review →</button>
          </form>
        )}

        {/* ── STEP 2: Review & Confirm ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ color: '#1e2d3d', margin: '0 0 4px' }}>Review & Confirm</h2>
            <p style={{ color: '#888', margin: '0 0 8px', fontSize: '0.9rem' }}>Double-check your details before confirming.</p>

            <div style={{ background: '#f7f8fa', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Name', form.name],
                ['Phone', form.phone],
                ...(form.email ? [['Email', form.email]] : []),
                ['Date & Time', appointmentDatetime],
                ...(car ? [['Car', `${car.model}${car.year ? ` (${car.year})` : ''}`]] : []),
                ...(form.notes ? [['Notes', form.notes]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                  <span style={{ color: '#7a93a8', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: '#1e2d3d', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>

            {form.email && (
              <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>
                A confirmation email with your profile link will be sent to <strong>{form.email}</strong>.
              </p>
            )}

            {error && <div className="book-error">{error}</div>}

            <button type="submit" className="btn-book" disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm Appointment'}
            </button>
          </form>
        )}

      </main>
    </div>
  );
}
