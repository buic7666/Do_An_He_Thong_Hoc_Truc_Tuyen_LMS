import React from 'react';

const isYouTubeUrl = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  } catch (_e) {
    return false;
  }
};

const getYouTubeEmbedSrc = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1).split(/[?&#]/)[0]}`;
    }
    if (u.pathname === '/watch') {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (u.pathname.startsWith('/embed/')) {
      return url;
    }
    if (u.pathname.startsWith('/shorts/')) {
      return `https://www.youtube.com/embed/${u.pathname.split('/shorts/')[1]}`;
    }
    return url;
  } catch (_e) {
    return url;
  }
};

const RichContentRenderer = ({ blocks = [] }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="rich-content-renderer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, idx) => {
        const t = String(block?.type || 'text');
        if (t === 'text') {
          return (
            <div key={idx} style={{ whiteSpace: 'pre-wrap', color: '#111' }}>
              {String(block.text || '')}
            </div>
          );
        }

        if (t === 'image') {
          const url = String(block.url || '').trim();
          if (!url) return null;
          return (
            <div key={idx} style={{ textAlign: 'center' }}>
              <img src={url} alt={String(block.alt || '')} style={{ maxWidth: '100%', borderRadius: 6 }} />
            </div>
          );
        }

        if (t === 'video') {
          const url = String(block.url || '').trim();
          if (!url) return null;
          // Embed YouTube safely
          if (isYouTubeUrl(url)) {
            const src = getYouTubeEmbedSrc(url);
            return (
              <div key={idx} style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  title={String(block.title || `video-${idx}`)}
                  src={src}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }

          // Fallback: render video tag
          return (
            <div key={idx}>
              <video controls style={{ width: '100%', borderRadius: 6 }}>
                <source src={url} />
                Your browser does not support the video tag.
              </video>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default RichContentRenderer;
