import { useState, useEffect } from 'react';
import { authFetch } from '../auth';

const PERMS = [
  { key: 'perm_view',   label: 'Read',   color: '#10b981', desc: 'Log in & view all admin data' },
  { key: 'perm_create', label: 'Create', color: '#3b82f6', desc: 'Add cars, leads & appointments' },
  { key: 'perm_edit',   label: 'Edit',   color: '#f59e0b', desc: 'Edit records & change status' },
  { key: 'perm_delete', label: 'Delete', color: '#ef4444', desc: 'Delete any record' },
];

const EMPTY_FORM = { username: '', password: '', perm_view: true, perm_create: false, perm_edit: false, perm_delete: false };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(null); // userId being saved
  const [localPerms, setLocalPerms] = useState({}); // { userId: { perm_view, ... } }

  const fetchUsers = async () => {
    const res = await authFetch('/api/users');
    const data = await res.json();
    if (data.success) {
      setUsers(data.data);
      // seed local perm state
      const lp = {};
      data.data.forEach(u => {
        lp[u.id] = {
          perm_view:   !!u.perm_view,
          perm_create: !!u.perm_create,
          perm_edit:   !!u.perm_edit,
          perm_delete: !!u.perm_delete,
        };
      });
      setLocalPerms(lp);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const res = await authFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setSuccess(`User "${form.username}" created.`);
      setForm(EMPTY_FORM);
      fetchUsers();
    } else {
      setError(data.message);
    }
  };

  const handlePermToggle = (userId, permKey) => {
    setLocalPerms(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [permKey]: !prev[userId][permKey] },
    }));
  };

  const savePerms = async (userId) => {
    setSaving(userId);
    const res = await authFetch(`/api/users/${userId}/perms`, {
      method: 'PATCH',
      body: JSON.stringify(localPerms[userId]),
    });
    const data = await res.json();
    if (!data.success) alert(data.message);
    setSaving(null);
    fetchUsers();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? They will lose access immediately.`)) return;
    const res = await authFetch(`/api/users/${user.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchUsers();
    else alert(data.message);
  };

  const staffUsers = users.filter(u => u.role !== 'admin');
  const adminUser  = users.find(u => u.role === 'admin');

  return (
    <div style={{ marginTop: 20 }}>

      {/* Context banner */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#1e40af',
      }}>
        <strong>Admin Panel Access Only</strong> — these users log in at <code>/admin/login</code> to manage the CRM.
        The public customer site (<code>/</code>) is always open with no login required.
      </div>

      <div className="grid-2">

        {/* ── Create User ── */}
        <div className="card">
          <h2>Create Staff User</h2>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleCreate}>
            <input
              placeholder="Username"
              required
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: 8 }}>
                Admin Panel Permissions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PERMS.map(p => (
                  <label key={p.key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 8,
                    border: `2px solid ${form[p.key] ? p.color : '#e5e7eb'}`,
                    background: form[p.key] ? `${p.color}12` : '#fafafa',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={form[p.key]}
                      onChange={() => setForm({ ...form, [p.key]: !form[p.key] })}
                      style={{ width: 16, height: 16, accentColor: p.color, flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: form[p.key] ? p.color : '#374151' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8 }}>
                * Read is required to log in. Without it the account is blocked.
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Create User
            </button>
          </form>
        </div>

        {/* ── User List ── */}
        <div className="card">
          <h2>Users ({users.length})</h2>

          {/* Admin row (read-only) */}
          {adminUser && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, marginBottom: 10,
              background: '#1e293b', color: '#fff',
            }}>
              <div>
                <span style={{ fontWeight: 700 }}>{adminUser.username}</span>
                <span style={{
                  marginLeft: 8, fontSize: '0.7rem', background: '#f59e0b',
                  color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 700,
                }}>ADMIN</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Full access · cannot be modified</span>
            </div>
          )}

          {/* Staff rows */}
          {staffUsers.length === 0 && (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No staff users yet. Create one on the left.</p>
          )}
          {staffUsers.map(user => {
            const lp = localPerms[user.id] || {};
            const changed = PERMS.some(p => !!lp[p.key] !== !!user[p.key]);
            return (
              <div key={user.id} data-testid="user-row" style={{
                border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '12px 14px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.username}</span>
                    <span style={{
                      marginLeft: 8, fontSize: '0.7rem', background: '#e0f2fe',
                      color: '#0369a1', borderRadius: 4, padding: '1px 6px', fontWeight: 600,
                    }}>STAFF</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {changed && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => savePerms(user.id)}
                        disabled={saving === user.id}
                      >
                        {saving === user.id ? 'Saving...' : '💾 Save'}
                      </button>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#dc2626' }}
                      onClick={() => handleDelete(user)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                {/* Permission toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {PERMS.map(p => {
                    const on = !!lp[p.key];
                    return (
                      <button
                        key={p.key}
                        onClick={() => handlePermToggle(user.id, p.key)}
                        style={{
                          padding: '7px 4px', borderRadius: 6,
                          border: `2px solid ${on ? p.color : '#e5e7eb'}`,
                          cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                          background: on ? p.color : '#f8fafc',
                          color: on ? '#fff' : '#94a3b8',
                          transition: 'all 0.15s',
                        }}
                      >
                        {on ? '✓' : '○'} {p.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 6 }}>
                  Created {new Date(user.created_at).toLocaleDateString()}
                  {changed && <span style={{ color: '#f59e0b', marginLeft: 8 }}>· Unsaved changes</span>}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
