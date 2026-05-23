import { useState, useEffect } from 'react';
import { authFetch } from '../auth';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Post Editor Modal ──────────────────────────────────────────────────────────

function PostModal({ post, onClose, onSaved }) {
  const editing = !!post;
  const [form, setForm] = useState({
    title:            post?.title            || '',
    slug:             post?.slug             || '',
    excerpt:          post?.excerpt          || '',
    content:          post?.content          || '',
    meta_description: post?.meta_description || '',
    cover_image:      post?.cover_image      || '',
    author:           post?.author           || '',
    published:        post?.published        ? true : false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('content'); // 'content' | 'seo' | 'preview'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (v) => {
    set('title', v);
    if (!editing || !form.slug || form.slug === slugify(form.title)) {
      set('slug', slugify(v));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content) { setError('Title, slug and content are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch(
        editing ? `/api/blog/${post.id}` : '/api/blog',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }
      );
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 1000, overflowY: 'auto', padding: '24px 16px',
    }} onClick={onClose}>
      <div style={{
        background: '#1e2130', borderRadius: 12, width: '100%', maxWidth: 780,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2a2f45' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 17 }}>{editing ? 'Edit Post' : 'New Post'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={e => set('published', e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Published
            </label>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a2f45' }}>
          {['content', 'seo', 'preview'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              color: tab === t ? '#e2e8f0' : '#64748b', fontWeight: tab === t ? 700 : 400,
              borderBottom: tab === t ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 24px', fontSize: 13 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px' }}>

            {tab === 'content' && (
              <>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title" style={inp} autoFocus />

                <label style={lbl}>Slug *</label>
                <input
                  value={form.slug}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="url-friendly-slug"
                  style={inp}
                />
                <div style={{ fontSize: 11, color: '#475569', marginTop: -10, marginBottom: 14 }}>
                  URL: /blog/{form.slug || 'your-slug'}
                </div>

                <label style={lbl}>Excerpt</label>
                <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short summary shown on the listing page…" rows={2} style={{ ...inp, resize: 'vertical' }} />

                <label style={lbl}>Content * <span style={{ color: '#475569', fontWeight: 400 }}>(Supports **bold**, *italic*, ## Heading, - lists)</span></label>
                <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your post content here…" rows={16} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />

                <label style={lbl}>Author</label>
                <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="Author name" style={inp} />
              </>
            )}

            {tab === 'seo' && (
              <>
                <label style={lbl}>Meta Description <span style={{ color: '#475569', fontWeight: 400 }}>(for Google preview, max 160 chars)</span></label>
                <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value.slice(0, 320))} placeholder="Brief description for search engines…" rows={3} style={{ ...inp, resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: form.meta_description.length > 160 ? '#ef4444' : '#475569', marginTop: -10, marginBottom: 14 }}>
                  {form.meta_description.length}/160 chars
                </div>

                <label style={lbl}>Cover Image URL</label>
                <input value={form.cover_image} onChange={e => set('cover_image', e.target.value)} placeholder="https://..." style={inp} />
                {form.cover_image && (
                  <img src={form.cover_image} alt="cover preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 14 }} onError={e => e.target.style.display='none'} />
                )}

                {/* Google SERP Preview */}
                <label style={lbl}>Google Preview</label>
                <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#1a0dab', fontSize: 18, marginBottom: 4 }}>
                    {form.title || 'Post Title'} | iqbalhakim
                  </div>
                  <div style={{ color: '#006621', fontSize: 13, marginBottom: 4 }}>
                    {window.location.origin}/blog/{form.slug || 'your-slug'}
                  </div>
                  <div style={{ color: '#545454', fontSize: 13, lineHeight: 1.5 }}>
                    {form.meta_description || form.excerpt || 'Add a meta description to show here…'}
                  </div>
                </div>
              </>
            )}

            {tab === 'preview' && (
              <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxHeight: 500, overflowY: 'auto' }}>
                {form.cover_image && <img src={form.cover_image} alt="" style={{ width: '100%', maxHeight: 250, objectFit: 'cover', borderRadius: 8, marginBottom: 20 }} onError={e => e.target.style.display='none'} />}
                <h1 style={{ color: '#1e2d3d', fontSize: '1.6rem', marginBottom: 12 }}>{form.title || 'Post Title'}</h1>
                {form.excerpt && <p style={{ color: '#555', fontStyle: 'italic', borderLeft: '4px solid #5ba4cf', paddingLeft: 12, marginBottom: 20 }}>{form.excerpt}</p>}
                <div style={{ color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>{form.content}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #2a2f45' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtn}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BlogAdminPage() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | post | {}

  useEffect(() => {
    (async () => {
      const res  = await authFetch('/api/blog/admin/all');
      const json = await res.json();
      if (json.success) setPosts(json.data);
      setLoading(false);
    })();
  }, []);

  const handleSaved = (saved, editing) => {
    setPosts(prev =>
      editing ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await authFetch(`/api/blog/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleTogglePublish = async (post) => {
    const updated = { ...post, published: !post.published };
    const res  = await authFetch(`/api/blog/${post.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    const json = await res.json();
    if (json.success) setPosts(prev => prev.map(p => p.id === post.id ? json.data : p));
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 22 }}>Blog Posts</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Manage SEO blog content</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.open('/blog', '_blank')}
            style={{ ...cancelBtn, color: '#94a3b8' }}
          >
            🌐 View Blog
          </button>
          <button onClick={() => setModal({})} style={saveBtn}>+ New Post</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ background: '#1e2130', borderRadius: 10, padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 6 }}>No blog posts yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first post to boost SEO</div>
          <button onClick={() => setModal({})} style={saveBtn}>+ New Post</button>
        </div>
      ) : (
        <div style={{ background: '#1e2130', borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2f45' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#151929' }}>
                {['Title', 'Slug', 'Author', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr key={post.id} style={{ borderTop: i > 0 ? '1px solid #2a2f45' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{post.title}</div>
                    {post.excerpt && <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{post.excerpt.slice(0, 60)}{post.excerpt.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{post.slug}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13 }}>{post.author || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleTogglePublish(post)}
                      style={{
                        border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        background: post.published ? '#d1fae5' : '#fee2e2',
                        color: post.published ? '#065f46' : '#991b1b',
                      }}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>{formatDate(post.created_at)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')} title="View" style={iconBtn}>👁️</button>
                      <button onClick={() => setModal(post)} title="Edit" style={iconBtn}>✏️</button>
                      <button onClick={() => handleDelete(post.id)} title="Delete" style={iconBtn}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <PostModal
          post={Object.keys(modal).length > 0 ? modal : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#151929', border: '1px solid #363d56',
  color: '#e2e8f0', borderRadius: 6, padding: '8px 10px',
  fontSize: 13, marginBottom: 14, outline: 'none', fontFamily: 'inherit',
};
const lbl = {
  display: 'block', color: '#94a3b8', fontSize: 12,
  fontWeight: 600, marginBottom: 5, letterSpacing: '0.03em',
};
const saveBtn = {
  background: '#4f46e5', color: '#fff', border: 'none',
  borderRadius: 6, padding: '8px 18px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
const cancelBtn = {
  background: '#2a2f45', color: '#94a3b8', border: 'none',
  borderRadius: 6, padding: '8px 18px', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 4,
};
