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

const isLikelyYouTubeUrl = (value) => {
  if (!value) {
    return false;
  }

  try {
    const u = new URL(String(value).trim());
    const host = u.hostname.replace('www.', '').toLowerCase();
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  } catch (_error) {
    return false;
  }
};

const RichContentRenderer = ({ blocks = [] }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const renderBlockTitle = (block, fallback) => {
    const title = String(block?.title || '').trim();
    if (!title && !fallback) {
      return null;
    }

    return (
      <div
        className="rich-content-renderer__media-title"
        style={{
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 700,
          color: '#0f172a',
          lineHeight: 1.45,
        }}
      >
        {title || fallback}
      </div>
    );
  };

  return (
    <div className="rich-content-renderer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, idx) => {
        const t = String(block?.type || 'text');
        if (t === 'text') {
          const text = String(block.text || '').trim();
          if (isLikelyYouTubeUrl(text)) {
            const src = getYouTubeEmbedSrc(text);
            return (
              <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video">
                {renderBlockTitle(block, '')}
                <div className="rich-content-renderer__video-frame">
                  <iframe
                    title={String(block.title || `video-${idx}`)}
                    src={src}
                    className="rich-content-renderer__video-iframe"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </figure>
            );
          }

          // Render HTML content if present (WYSIWYG editor stores HTML)
          return (
            <div key={idx} className="rich-content-renderer__text" style={{ whiteSpace: 'pre-wrap', color: '#111' }} dangerouslySetInnerHTML={{ __html: text }} />
          );
        }

        if (t === 'image') {
          const url = String(block.url || '').trim();
          if (!url) return null;
          return (
            <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--image" style={{ textAlign: 'center' }}>
              {renderBlockTitle(block, '')}
              <img src={url} alt={String(block.alt || '')} style={{ maxWidth: '100%', borderRadius: 6 }} />
              {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
            </figure>
          );
        }

        if (t === 'video') {
          const url = String(block.url || '').trim();
          if (!url) return null;
          // Embed YouTube safely
          if (isYouTubeUrl(url)) {
            const src = getYouTubeEmbedSrc(url);
            return (
              <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video">
                {renderBlockTitle(block, '')}
                <div className="rich-content-renderer__video-frame">
                  <iframe
                    title={String(block.title || `video-${idx}`)}
                    src={src}
                    className="rich-content-renderer__video-iframe"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
              </figure>
            );
          }

          // Fallback: render video tag
          return (
            <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video">
              <video controls style={{ width: '100%', borderRadius: 6 }}>
                <source src={url} />
                Your browser does not support the video tag.
              </video>
              {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
};

export default RichContentRenderer;
