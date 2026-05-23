import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './public.css';

const SITE_NAME = 'iqbalhakim';
const SITE_DESC = 'Your trusted used car dealer in Alor Star, Kedah. Tips, guides and car buying advice.';

function useSEO({ title, description }) {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    return () => {
      document.title = SITE_NAME;
      removeMeta('description');
      removeMeta('og:title', 'property');
      removeMeta('og:description', 'property');
      removeMeta('og:type', 'property');
    };
  }, [title, description]);
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function removeMeta(name, attr = 'name') {
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.remove();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useSEO({
    title: `Car Buying Tips & Guides | ${SITE_NAME}`,
    description: SITE_DESC,
  });

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => { if (d.success) setPosts(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <h1 className="pub-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{SITE_NAME}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" onClick={() => navigate('/')}>← Back to Cars</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="pub-hero" style={{ padding: '40px 16px' }}>
        <div className="pub-hero-inner">
          <h2 className="pub-hero-title" style={{ fontSize: '1.8rem' }}>Car Tips & Guides</h2>
          <p className="pub-hero-sub">Expert advice on buying used cars, loan tips, and more</p>
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px' }}>

        {/* JSON-LD structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: `${SITE_NAME} Blog`,
          description: SITE_DESC,
          url: window.location.origin + '/blog',
        })}} />

        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>Loading…</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No posts yet</div>
            <div>Check back soon for car tips and guides.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 28 }}>
            {posts.map(post => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                style={{
                  background: '#fff', borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
                  border: '1px solid #e5e7eb', display: 'flex',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'none'; }}
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    style={{ width: 220, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ padding: '24px 28px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{
                      background: '#eef3f7', color: '#1a6fa8', fontSize: 12,
                      fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    }}>Guide</span>
                    <span style={{ color: '#aaa', fontSize: 12 }}>{formatDate(post.created_at)}</span>
                    {post.author && <span style={{ color: '#aaa', fontSize: 12 }}>by {post.author}</span>}
                  </div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#1e2d3d', lineHeight: 1.35 }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14, lineHeight: 1.6 }}>
                      {post.excerpt}
                    </p>
                  )}
                  <span style={{ color: '#1a6fa8', fontSize: 13, fontWeight: 600 }}>Read more →</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '32px 16px', color: '#aaa', fontSize: 13, borderTop: '1px solid #e5e7eb', marginTop: 40 }}>
        © {new Date().getFullYear()} {SITE_NAME} · <span style={{ cursor: 'pointer', color: '#1a6fa8' }} onClick={() => navigate('/')}>View Cars</span>
      </footer>
    </div>
  );
}
