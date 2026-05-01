import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

const COLUMNS = [
  { key: 'todo',       label: 'To Do',       color: '#6b7280' },
  { key: 'inprogress', label: 'In Progress',  color: '#f59e0b' },
  { key: 'review',     label: 'Review',       color: '#3b82f6' },
  { key: 'done',       label: 'Done',         color: '#10b981' },
];

const PRIORITY_META = {
  low:      { label: 'Low',      color: '#10b981', bg: '#d1fae5' },
  medium:   { label: 'Medium',   color: '#f59e0b', bg: '#fef3c7' },
  high:     { label: 'High',     color: '#ef4444', bg: '#fee2e2' },
  critical: { label: 'Critical', color: '#7c3aed', bg: '#ede9fe' },
};

function priorityBadge(priority) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      color: m.color, background: m.bg, letterSpacing: '0.03em',
    }}>
      {m.label}
    </span>
  );
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ── Issue Modal ───────────────────────────────────────────────────────────────

function IssueModal({ issue, projectId, onClose, onSaved }) {
  const editing = !!issue;
  const [form, setForm] = useState({
    title:       issue?.title       || '',
    description: issue?.description || '',
    priority:    issue?.priority    || 'medium',
    assignee:    issue?.assignee    || '',
    status:      issue?.status      || 'todo',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      let res;
      if (editing) {
        res = await authFetch(`/api/jira/issues/${issue.id}`, {
          method: 'PUT', body: JSON.stringify(form),
        });
      } else {
        res = await authFetch(`/api/jira/projects/${projectId}/issues`, {
          method: 'POST', body: JSON.stringify(form),
        });
      }
      const json = await res.json();
      if (!json.success) { setError(json.message); setSaving(false); return; }
      onSaved(json.data, editing);
      onClose();
    } catch {
      setError('Request failed');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#1e2130', borderRadius: 10, padding: 28, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 17 }}>
            {editing ? 'Edit Issue' : 'Create Issue'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Title *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Issue title"
            style={inputStyle}
            autoFocus
          />

          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Optional description…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Assignee</label>
          <input
            value={form.assignee}
            onChange={e => set('assignee', e.target.value)}
            placeholder="Name or username"
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtnStyle}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Project Modal ─────────────────────────────────────────────────────────────

function ProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', key_code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v) => {
    set('name', v);
    if (!form.key_code || form.key_code === autoKey(form.name)) {
      set('key_code', autoKey(v));
    }
  };

  const autoKey = (name) =>
    name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.key_code.trim()) { setError('Name and key are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/jira/projects', { method: 'POST', body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) { setError(json.message); setSaving(false); return; }
      onCreated(json.data);
      onClose();
    } catch {
      setError('Request failed');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#1e2130', borderRadius: 10, padding: 28, width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 17 }}>New Project</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Project Name *</label>
          <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Car Sales Sprint" style={inputStyle} autoFocus />
          <label style={labelStyle}>Project Key *</label>
          <input
            value={form.key_code}
            onChange={e => set('key_code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
            placeholder="e.g. CSS"
            style={inputStyle}
          />
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtnStyle}>{saving ? 'Creating…' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────────

function IssueCard({ issue, onEdit, onDelete, onStatusChange }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('issueId', issue.id); setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      style={{
        background: '#2a2f45', borderRadius: 8, padding: '12px 14px',
        marginBottom: 8, cursor: 'grab', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        opacity: dragging ? 0.4 : 1, transition: 'opacity 0.15s',
        border: '1px solid #363d56',
      }}
    >
      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>
        {issue.title}
      </div>
      {issue.description && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {issue.description}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {priorityBadge(issue.priority)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {issue.assignee && (
            <div title={issue.assignee} style={{
              width: 24, height: 24, borderRadius: '50%', background: '#4f46e5',
              color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initials(issue.assignee)}
            </div>
          )}
          <button
            onClick={() => onEdit(issue)}
            title="Edit"
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: 2 }}
          >✏️</button>
          <button
            onClick={() => onDelete(issue.id)}
            title="Delete"
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: 2 }}
          >🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Board ──────────────────────────────────────────────────────────────

function Board({ project, onBack }) {
  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | { issue?, defaultStatus }
  const [dragOver, setDragOver]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await authFetch(`/api/jira/projects/${project.id}/issues`);
    const json = await res.json();
    if (json.success) setIssues(json.data);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved, editing) => {
    setIssues(prev =>
      editing
        ? prev.map(i => i.id === saved.id ? saved : i)
        : [saved, ...prev]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    await authFetch(`/api/jira/issues/${id}`, { method: 'DELETE' });
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  const handleDrop = async (e, targetStatus) => {
    const id = Number(e.dataTransfer.getData('issueId'));
    setDragOver(null);
    const issue = issues.find(i => i.id === id);
    if (!issue || issue.status === targetStatus) return;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: targetStatus } : i));
    await authFetch(`/api/jira/issues/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: targetStatus }),
    });
  };

  const byStatus = (status) => issues.filter(i => i.status === status);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: '2px 4px' }}>←</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 12,
              padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em',
            }}>{project.key_code}</span>
            <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 20 }}>{project.name}</h2>
          </div>
          {project.description && (
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setModal({ issue: null })}
          style={{ marginLeft: 'auto', ...saveBtnStyle }}
        >
          + Create Issue
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {COLUMNS.map(col => (
            <div
              key={col.key}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.key)}
              style={{
                background: dragOver === col.key ? '#1a1f2e' : '#151929',
                borderRadius: 10, padding: 12,
                border: dragOver === col.key ? `2px dashed ${col.color}` : '2px solid transparent',
                transition: 'border 0.15s, background 0.15s',
                minHeight: 200,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>{col.label}</span>
                  <span style={{
                    background: '#2a2f45', color: '#64748b', borderRadius: 10,
                    fontSize: 11, padding: '1px 7px', fontWeight: 600,
                  }}>{byStatus(col.key).length}</span>
                </div>
                <button
                  onClick={() => setModal({ issue: null, defaultStatus: col.key })}
                  title="Add issue"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                >+</button>
              </div>

              {/* Cards */}
              {byStatus(col.key).map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onEdit={i => setModal({ issue: i })}
                  onDelete={handleDelete}
                  onStatusChange={(id, status) => {
                    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
                  }}
                />
              ))}

              {byStatus(col.key).length === 0 && (
                <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
                  Drop issues here
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <IssueModal
          issue={modal.issue || null}
          projectId={project.id}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Projects List ─────────────────────────────────────────────────────────────

function ProjectsList({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      const res  = await authFetch('/api/jira/projects');
      const json = await res.json();
      if (json.success) setProjects(json.data);
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its issues?')) return;
    await authFetch(`/api/jira/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 22 }}>Projects</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Select a project to open its board</p>
        </div>
        <button onClick={() => setShowModal(true)} style={saveBtnStyle}>+ New Project</button>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading…</div>
      ) : projects.length === 0 ? (
        <div style={{
          background: '#1e2130', borderRadius: 10, padding: 48,
          textAlign: 'center', color: '#64748b',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, marginBottom: 6, color: '#94a3b8' }}>No projects yet</div>
          <div style={{ fontSize: 13 }}>Create your first project to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: '#1e2130', borderRadius: 10, padding: 20,
                cursor: 'pointer', border: '1px solid #2a2f45',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2f45'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 12,
                  padding: '3px 10px', borderRadius: 4, letterSpacing: '0.05em',
                }}>{p.key_code}</span>
                <button
                  onClick={e => handleDelete(p.id, e)}
                  title="Delete project"
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14 }}
                >🗑️</button>
              </div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.name}</div>
              {p.description && (
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>{p.description}</div>
              )}
              <div style={{ color: '#475569', fontSize: 12 }}>
                {p.issue_count} issue{p.issue_count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JiraPage() {
  const [activeProject, setActiveProject] = useState(null);

  return (
    <div style={{ padding: '24px 0' }}>
      {activeProject
        ? <Board project={activeProject} onBack={() => setActiveProject(null)} />
        : <ProjectsList onSelect={setActiveProject} />
      }
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#151929', border: '1px solid #363d56',
  color: '#e2e8f0', borderRadius: 6, padding: '8px 10px',
  fontSize: 13, marginBottom: 14, outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', color: '#94a3b8', fontSize: 12,
  fontWeight: 600, marginBottom: 5, letterSpacing: '0.03em',
};

const saveBtnStyle = {
  background: '#4f46e5', color: '#fff', border: 'none',
  borderRadius: 6, padding: '8px 18px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};

const cancelBtnStyle = {
  background: '#2a2f45', color: '#94a3b8', border: 'none',
  borderRadius: 6, padding: '8px 18px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
