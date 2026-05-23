import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './public.css';

const SITE_NAME = 'iqbalhakim';

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function removeMeta(name, attr = 'name') {
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.remove();
}
function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', url);
}
function removeCanonical() {
  const el = document.querySelector('link[rel="canonical"]');
  if (el) el.remove();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Simple markdown-like renderer: supports **bold**, *italic*, ## headings, - lists, blank lines → paragraphs
function renderContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.4rem', color: '#1e2d3d', margin: '32px 0 12px', lineHeight: 1.3 }}>{inline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '1.15rem', color: '#1e2d3d', margin: '24px 0 8px' }}>{inline(line.slice(4))}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(<li key={i} style={{ marginBottom: 6 }}>{inline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: 24, margin: '12px 0', color: '#444', lineHeight: 1.7 }}>{items}</ul>);
      continue;
    } else if (line.trim() === '') {
      // skip blank lines (used as paragraph separators)
    } else {
      elements.push(<p key={i} style={{ margin: '0 0 18px', color: '#444', lineHeight: 1.8, fontSize: '1rem' }}>{inline(line)}</p>);
    }
    i++;
  }
  return elements;
}

function inline(text) {
  // Split on **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPost(d.data);
          // SEO
          const title = `${d.data.title} | ${SITE_NAME}`;
          const desc = d.data.meta_description || d.data.excerpt || '';
          document.title = title;
          setMeta('description', desc);
          setMeta('og:title', title, 'property');
          setMeta('og:description', desc, 'property');
          setMeta('og:type', 'article', 'property');
          if (d.data.cover_image) setMeta('og:image', d.data.cover_image, 'property');
          setCanonical(window.location.origin + '/blog/' + slug);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });

    return () => {
      document.title = SITE_NAME;
      removeMeta('description');
      removeMeta('og:title', 'property');
      removeMeta('og:description', 'property');
      removeMeta('og:type', 'property');
      removeMeta('og:image', 'property');
      removeCanonical();
    };
  }, [slug]);

  if (loading) return (
    <div className="pub-layout">
      <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>Loading…</div>
    </div>
  );

  if (notFound) return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <h1 className="pub-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{SITE_NAME}</h1>
        </div>
      </header>
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h2 style={{ color: '#1e2d3d' }}>Post not found</h2>
        <button className="admin-btn" style={{ marginTop: 16 }} onClick={() => navigate('/blog')}>← Back to Blog</button>
      </div>
    </div>
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt || '',
    author: { '@type': 'Person', name: post.author || SITE_NAME },
    datePublished: post.created_at,
    dateModified: post.updated_at,
    publisher: { '@type': 'Organization', name: SITE_NAME },
    ...(post.cover_image ? { image: post.cover_image } : {}),
    url: window.location.href,
  };

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <h1 className="pub-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{SITE_NAME}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" onClick={() => navigate('/blog')}>← Blog</button>
            <button className="admin-btn" onClick={() => navigate('/')}>🚗 View Cars</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px 80px' }}>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {/* Cover image */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, marginBottom: 36 }}
          />
        )}

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ background: '#eef3f7', color: '#1a6fa8', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Guide</span>
          <span style={{ color: '#aaa', fontSize: 13 }}>{formatDate(post.created_at)}</span>
          {post.author && <span style={{ color: '#888', fontSize: 13 }}>by <strong>{post.author}</strong></span>}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e2d3d', lineHeight: 1.25, margin: '0 0 24px' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{
            fontSize: '1.1rem', color: '#555', lineHeight: 1.7,
            borderLeft: '4px solid #5ba4cf', paddingLeft: 16,
            marginBottom: 32, fontStyle: 'italic',
          }}>{post.excerpt}</p>
        )}

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 32px' }} />

        {/* Content */}
        <div style={{ fontSize: '1rem', lineHeight: 1.8 }}>
          {renderContent(post.content)}
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2d3d, #2a4a6b)',
          borderRadius: 12, padding: '28px 32px', marginTop: 48, textAlign: 'center',
        }}>
          <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>
            Looking for a quality used car?
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#c9a84c', color: '#0a0f1a', border: 'none',
              borderRadius: 24, padding: '12px 28px', fontWeight: 700,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            Browse Our Cars →
          </button>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px 16px', color: '#aaa', fontSize: 13, borderTop: '1px solid #e5e7eb' }}>
        © {new Date().getFullYear()} {SITE_NAME}
      </footer>
    </div>
  );
}
