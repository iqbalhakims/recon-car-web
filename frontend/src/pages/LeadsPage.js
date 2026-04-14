import { useState, useEffect } from 'react';

const API_LEADS = '/api/leads';
const API_CARS = '/api/cars';
const API_APPOINTMENTS = '/api/appointments';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', car_id: '', next_follow_up_date: '' });
  const [error, setError] = useState('');

  // Appointment modal state
  const [selectedLead, setSelectedLead] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ appointment_date: '', notes: '' });
  const [apptError, setApptError] = useState('');

  const fetchAll = async () => {
    const [lRes, cRes] = await Promise.all([fetch(API_LEADS), fetch(API_CARS)]);
    const [lData, cData] = await Promise.all([lRes.json(), cRes.json()]);
    if (lData.success) setLeads(lData.data);
    if (cData.success) setCars(cData.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(API_LEADS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setForm({ name: '', phone: '', car_id: '', next_follow_up_date: '' });
      fetchAll();
    } else {
      setError(data.message);
    }
  };

  const updateLead = async (id, status) => {
    await fetch(`${API_LEADS}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  // Appointment handlers
  const openAppointments = async (lead) => {
    setSelectedLead(lead);
    setApptError('');
    setApptForm({ appointment_date: '', notes: '' });
    const res = await fetch(`${API_APPOINTMENTS}/lead/${lead.id}`);
    const data = await res.json();
    if (data.success) setAppointments(data.data);
  };

  const closeModal = () => {
    setSelectedLead(null);
    setAppointments([]);
    setApptError('');
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    setApptError('');
    const res = await fetch(API_APPOINTMENTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: selectedLead.id, ...apptForm }),
    });
    const data = await res.json();
    if (data.success) {
      setApptForm({ appointment_date: '', notes: '' });
      openAppointments(selectedLead);
    } else {
      setApptError(data.message);
    }
  };

  const updateApptStatus = async (id, status) => {
    await fetch(`${API_APPOINTMENTS}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    openAppointments(selectedLead);
  };

  const deleteAppointment = async (id) => {
    await fetch(`${API_APPOINTMENTS}/${id}`, { method: 'DELETE' });
    openAppointments(selectedLead);
  };

  const statusBadge = (status) => {
    const colors = { scheduled: '#2563eb', completed: '#16a34a', cancelled: '#dc2626' };
    return (
      <span style={{
        background: colors[status] || '#888',
        color: '#fff',
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
      }}>{status}</span>
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="grid-2">
        <div className="card">
          <h2>Add Lead</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="Customer Name" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Phone (e.g. 0123456789)" required
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <select value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}>
              <option value="">-- Select Car (optional) --</option>
              {cars.filter(c => c.status === 'available').map(c => (
                <option key={c.id} value={c.id}>{c.model} — RM{c.price?.toLocaleString()}</option>
              ))}
            </select>
            <input type="date" placeholder="Next Follow-Up Date"
              value={form.next_follow_up_date}
              onChange={e => setForm({ ...form, next_follow_up_date: e.target.value })} />
            <button type="submit" className="btn btn-primary">Add Lead</button>
          </form>
        </div>

        <div className="card">
          <h2>Leads ({leads.length})</h2>
          <div className="table-wrap"><table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Car</th><th>Follow-Up</th><th>Status</th><th>Appt</th></tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.car_model || '—'}</td>
                  <td>{lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <select className="btn btn-sm btn-secondary"
                      value={lead.status}
                      onChange={e => updateLead(lead.id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => openAppointments(lead)}>
                      Set Appt
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan="6" style={{textAlign:'center',color:'#aaa'}}>No leads yet</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* Appointment Modal */}
      {selectedLead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, width: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Appointments — {selectedLead.name}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Book form */}
            <form onSubmit={bookAppointment} style={{ marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Book Appointment</h3>
              {apptError && <div className="alert alert-error">{apptError}</div>}
              <input type="datetime-local" required
                value={apptForm.appointment_date}
                onChange={e => setApptForm({ ...apptForm, appointment_date: e.target.value })}
                style={{ marginBottom: 8 }} />
              <textarea placeholder="Notes (optional)" rows={2}
                value={apptForm.notes}
                onChange={e => setApptForm({ ...apptForm, notes: e.target.value })}
                style={{ width: '100%', marginBottom: 8, padding: 8, boxSizing: 'border-box' }} />
              <button type="submit" className="btn btn-primary">Book</button>
            </form>

            {/* Appointment list */}
            <h3>Upcoming / Past</h3>
            {appointments.length === 0 && <p style={{ color: '#aaa' }}>No appointments yet.</p>}
            {appointments.map(appt => (
              <div key={appt.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{new Date(appt.appointment_date).toLocaleString()}</strong>
                  {statusBadge(appt.status)}
                </div>
                {appt.notes && <p style={{ margin: '6px 0 8px', color: '#555' }}>{appt.notes}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {appt.status === 'scheduled' && (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => updateApptStatus(appt.id, 'completed')}>
                        Mark Done
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => updateApptStatus(appt.id, 'cancelled')}>
                        Cancel
                      </button>
                    </>
                  )}
                  <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }}
                    onClick={() => deleteAppointment(appt.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
