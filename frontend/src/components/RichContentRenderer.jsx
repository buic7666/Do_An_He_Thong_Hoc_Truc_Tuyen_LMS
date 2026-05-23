import React from 'react';

const isYouTubeUrl = (url) => {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace('www.', '').toLowerCase();
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  } catch (_e) {
    return false;
  }
};

const getYouTubeEmbedSrc = (url) => {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace('www.', '').toLowerCase();

    let videoId = '';
    if (host === 'youtu.be') {
      videoId = u.pathname.slice(1).split(/[?&#]/)[0];
    } else if (u.pathname === '/watch') {
      videoId = u.searchParams.get('v') || '';
    } else if (u.pathname.startsWith('/embed/')) {
      videoId = u.pathname.split('/embed/')[1]?.split(/[?&#]/)[0] || '';
    } else if (u.pathname.startsWith('/shorts/')) {
      videoId = u.pathname.split('/shorts/')[1]?.split(/[?&#]/)[0] || '';
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&fs=0&controls=1` : String(url || '');
  } catch (_e) {
    return String(url || '');
  }
};

const getYouTubeVideoId = (url) => {
  try {
    const u = new URL(String(url || '').trim());
    const host = u.hostname.replace('www.', '').toLowerCase();

    if (host === 'youtu.be') {
      return u.pathname.slice(1).split(/[?&#]/)[0] || '';
    }
    if (u.pathname === '/watch') {
      return u.searchParams.get('v') || '';
    }
    if (u.pathname.startsWith('/embed/')) {
      return u.pathname.split('/embed/')[1]?.split(/[?&#]/)[0] || '';
    }
    if (u.pathname.startsWith('/shorts/')) {
      return u.pathname.split('/shorts/')[1]?.split(/[?&#]/)[0] || '';
    }
    return '';
  } catch (_e) {
    return '';
  }
};

const getYouTubeThumbSrc = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};

const escapeHtmlAttr = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const buildExpandedVideoHtml = (embedSrc, title) => {
  const safeSrc = escapeHtmlAttr(embedSrc);
  const safeTitle = escapeHtmlAttr(title || 'YouTube video');
  return `<span data-inline-video-expanded="1" style="display:inline-block;vertical-align:middle;width:180px;max-width:100%;margin:0 6px;line-height:0;border-radius:8px;overflow:hidden;background:#000;box-shadow:0 2px 10px rgba(0,0,0,0.12);"><iframe title="${safeTitle}" src="${safeSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation" style="width:180px;height:101px;border:0;display:block;"></iframe></span>`;
};

const buildClickableVideoHtml = (url, title) => {
  const embedSrc = getYouTubeEmbedSrc(url);
  const thumbSrc = getYouTubeThumbSrc(url);
  const expandedHtml = buildExpandedVideoHtml(embedSrc, title);
  const safeExpandedHtml = escapeHtmlAttr(expandedHtml);
  const safeThumb = escapeHtmlAttr(thumbSrc);
  const safeTitle = escapeHtmlAttr(title || 'YouTube video');
  return `
    <span
      data-inline-video="1"
      data-expanded-html="${safeExpandedHtml}"
      onclick="this.outerHTML=this.getAttribute('data-expanded-html');"
      style="display:inline-block;vertical-align:middle;width:180px;max-width:100%;margin:0 6px;line-height:0;border-radius:8px;overflow:hidden;background:#000;box-shadow:0 2px 10px rgba(0,0,0,0.12);cursor:pointer;position:relative;"
      title="${safeTitle}"
    >
      ${thumbSrc ? `<img src="${safeThumb}" alt="${safeTitle}" style="width:180px;height:101px;object-fit:cover;display:block;" />` : `<span style="width:180px;height:101px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">Video</span>`}
      <span aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.18);color:#fff;font-size:24px;font-weight:700;">▶</span>
    </span>
  `;
};

const isYouTubeHref = (href) => {
  try {
    return isYouTubeUrl(href);
  } catch (_e) {
    return false;
  }
};

const embedYouTubeLinksInHtml = (html) => {
  const raw = String(html || '').trim();
  if (!raw) return raw;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));

    anchors.forEach((anchor) => {
      const href = String(anchor.getAttribute('href') || '').trim();
      if (!isYouTubeHref(href)) return;

      const videoHtml = buildClickableVideoHtml(href, anchor.textContent?.trim() || 'YouTube video');
      const fragment = doc.createRange().createContextualFragment(videoHtml);
      anchor.replaceWith(fragment);
    });

    return doc.body.innerHTML;
  } catch (_e) {
    return raw;
  }
};

const RichContentRenderer = ({ blocks = [] }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const renderBlockTitle = (block, fallback) => {
    const title = String(block?.title || '').trim();
    if (!title && !fallback) return null;

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

  const renderInlineVideo = (url, title) => (
    <span
      dangerouslySetInnerHTML={{
        __html: buildClickableVideoHtml(url, title),
      }}
    />
  );

  return (
    <div className="rich-content-renderer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, idx) => {
        const t = String(block?.type || 'text');

        if (t === 'text') {
          const text = String(block.text || '').trim();
          if (isYouTubeUrl(text)) {
            return (
              <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video" style={{ margin: 0 }}>
                {renderBlockTitle(block, '')}
                {renderInlineVideo(text, String(block.title || `video-${idx}`), `text-${idx}`)}
              </figure>
            );
          }

          return (
            <div key={idx} className="rich-content-renderer__text" style={{ whiteSpace: 'pre-wrap', color: '#111' }} dangerouslySetInnerHTML={{ __html: embedYouTubeLinksInHtml(text) }} />
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

          if (isYouTubeUrl(url)) {
            return (
              <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video" style={{ margin: 0 }}>
                {renderBlockTitle(block, '')}
                {renderInlineVideo(url, String(block.title || `video-${idx}`), `video-${idx}`)}
                {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
              </figure>
            );
          }

          return (
            <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video" style={{ margin: 0 }}>
              <video controls style={{ width: 240, maxWidth: '100%', borderRadius: 6, display: 'inline-block', verticalAlign: 'middle' }}>
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
