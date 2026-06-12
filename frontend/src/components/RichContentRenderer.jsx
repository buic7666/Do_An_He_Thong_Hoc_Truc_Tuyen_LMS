import React from 'react';

const isLikelyImageUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;

  if (/^(data:image\/[a-zA-Z0-9.+-]+;base64,)/i.test(raw)) {
    return true;
  }

  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(raw)) {
    return true;
  }

  if (/\/(uploads\/images\/|uploads\/images\/)/i.test(raw)) {
    return true;
  }

  return false;
};

const getApiOrigin = () => {
  const base = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim();
  if (!base) return '';

  try {
    const parsed = new URL(base);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (_error) {
    return '';
  }
};

const resolveMediaUrl = (rawUrl) => {
  const url = String(rawUrl || '').trim();
  if (!url) return '';

  if (/^(data:|blob:)/i.test(url)) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return url;

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${apiOrigin}${normalizedPath}`;
};

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

const buildVideoFrameSrc = (url) => getYouTubeEmbedSrc(url);

const buildVideoIframeHtml = (url, title) => {
  const safeSrc = escapeHtmlAttr(buildVideoFrameSrc(url));
  const safeTitle = escapeHtmlAttr(title || 'YouTube video');
  return `<span class="rich-content-renderer__video-frame" style="display:block;position:relative;width:100%;max-width:640px;aspect-ratio:16 / 9;border-radius:8px;overflow:hidden;background:#000;"><iframe title="${safeTitle}" src="${safeSrc}" class="rich-content-renderer__video-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:100%;border:0;display:block;"></iframe></span>`;
};

const isYouTubeHref = (href) => {
  try {
    return isYouTubeUrl(href);
  } catch (_e) {
    return false;
  }
};

const BROKEN_IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14">Image not found</text></svg>';

const embedYouTubeLinksInHtml = (html) => {
  const raw = String(html || '').trim();
  if (!raw) return raw;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');

    const editorOnlyButtons = Array.from(doc.querySelectorAll('[data-remove-image="1"], [data-editor-remove-only="1"]'));
    editorOnlyButtons.forEach((button) => button.remove());

    const mediaNodes = Array.from(doc.querySelectorAll('img[src], source[src], video[src]'));
    mediaNodes.forEach((node) => {
      const currentSrc = String(node.getAttribute('src') || '').trim();
      if (!currentSrc) return;
      node.setAttribute('src', resolveMediaUrl(currentSrc));
      try {
        node.setAttribute('onerror', `this.onerror=null;this.src='${BROKEN_IMG_PLACEHOLDER}'`);
      } catch (_e) {
        // ignore
      }
    });

    const anchors = Array.from(doc.querySelectorAll('a[href]'));

    anchors.forEach((anchor) => {
      const href = String(anchor.getAttribute('href') || '').trim();
      if (!isYouTubeHref(href)) return;

      const videoHtml = buildVideoIframeHtml(href, anchor.textContent?.trim() || 'YouTube video');
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

  const renderInlineVideo = (url, title, keyHint) => {
    const embedSrc = buildVideoFrameSrc(url);

    return (
      <div
        key={keyHint}
        className="rich-content-renderer__video-frame"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          aspectRatio: '16 / 9',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <iframe
          title={title || 'YouTube video'}
          src={embedSrc}
          className="rich-content-renderer__video-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
          }}
        />
      </div>
    );
  };

  return (
    <div className="rich-content-renderer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, idx) => {
        const t = String(block?.type || 'text');

        if (t === 'text') {
          const text = String(block.text || '').trim();
          if (text.includes('<') && text.includes('>')) {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/html');
              const images = Array.from(doc.querySelectorAll('img[src]'));
              const iframes = Array.from(doc.querySelectorAll('iframe[src]'));
              const plainText = String(doc.body.textContent || '').replace(/\s+/g, ' ').trim();

              if (images.length > 0) {
                console.log('RichContentRenderer: rendering inline image(s)', { idx, images: images.map(img=>img.getAttribute('src')) });
                return (
                  <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--image" style={{ textAlign: 'center' }}>
                    {renderBlockTitle(block, '')}
                    {plainText && plainText !== String(text || '').trim() ? (
                      <div style={{ marginBottom: 8, whiteSpace: 'pre-wrap', color: '#111' }}>{plainText}</div>
                    ) : null}
                    {images.map((imageNode, imageIndex) => {
                      const src = resolveMediaUrl(imageNode.getAttribute('src'));
                      const alt = String(imageNode.getAttribute('alt') || block.alt || '').trim();
                      return (
                        <img
                          key={`${idx}-img-${imageIndex}`}
                          src={src}
                          alt={alt}
                          style={{ maxWidth: '100%', borderRadius: 6, marginTop: imageIndex === 0 ? 0 : 8 }}
                          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = BROKEN_IMG_PLACEHOLDER; }}
                        />
                      );
                    })}
                    {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
                  </figure>
                );
              }

              if (iframes.length > 0) {
                const iframe = iframes[0];
                const src = resolveMediaUrl(String(iframe.getAttribute('src') || '').trim());
                if (src) {
                  return (
                    <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--video" style={{ margin: 0 }}>
                      {renderBlockTitle(block, '')}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: buildClickableVideoHtml(src, String(iframe.getAttribute('title') || block.title || `video-${idx}`)),
                        }}
                      />
                      {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
                    </figure>
                  );
                }
              }

              if (plainText) {
                return (
                  <div key={idx} className="rich-content-renderer__text" style={{ whiteSpace: 'pre-wrap', color: '#111' }}>
                    {plainText}
                  </div>
                );
              }
            } catch (_error) {
              // fall through to plain handling
            }
          }

          if (isLikelyImageUrl(text)) {
            const imageUrl = resolveMediaUrl(text);
            console.log('RichContentRenderer: rendering image url from text block', { idx, url: text });
            return (
              <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--image" style={{ textAlign: 'center' }}>
                {renderBlockTitle(block, '')}
                <img src={imageUrl} alt={String(block.alt || '')} style={{ maxWidth: '100%', borderRadius: 6 }} />
                {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
              </figure>
            );
          }

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
                const url = resolveMediaUrl(block.url);
                if (!url) return null;
                console.log('RichContentRenderer: rendering image block', { idx, url: block.url });
                return (
                  <figure key={idx} className="rich-content-renderer__figure rich-content-renderer__figure--image" style={{ textAlign: 'center' }}>
                    {renderBlockTitle(block, '')}
                    <img
                      src={url}
                      alt={String(block.alt || '')}
                      style={{ maxWidth: '100%', borderRadius: 6 }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BROKEN_IMG_PLACEHOLDER; }}
                    />
                    {block.caption ? <figcaption className="rich-content-renderer__caption">{String(block.caption)}</figcaption> : null}
                  </figure>
                );
        }

        if (t === 'video') {
          const url = resolveMediaUrl(block.url);
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
