const HTML_TAG_REGEX = /<[^>]*>/g;
const IMAGE_TAG_REGEX = /<img\b[^>]*>/gi;
const IFRAME_TAG_REGEX = /<iframe\b[^>]*>/gi;
const REMOVE_EDITOR_BUTTON_REGEX = /<button\b[^>]*data-editor-remove-only=["']?1["']?[^>]*>[\s\S]*?<\/button>/gi;

const decodeHtmlEntities = (value) => String(value || '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&#x2F;/gi, '/');

const stripHtml = (value) => decodeHtmlEntities(String(value || '').replace(HTML_TAG_REGEX, ' '))
  .replace(/\s+/g, ' ')
  .trim();

const getAttribute = (tag, attributeName) => {
  const matcher = new RegExp(`${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = String(tag || '').match(matcher);
  return decodeHtmlEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
};

const normalizeHtmlTextBlock = (text) => {
  const rawText = decodeHtmlEntities(String(text || '').trim());
  if (!rawText) {
    return [];
  }

  if (!rawText.includes('<')) {
    return [{ type: 'text', text: rawText }];
  }

  const sanitizedHtml = rawText.replace(REMOVE_EDITOR_BUTTON_REGEX, '');
  const imageMatches = [...sanitizedHtml.matchAll(IMAGE_TAG_REGEX)];
  const iframeMatches = [...sanitizedHtml.matchAll(IFRAME_TAG_REGEX)];

  if (imageMatches.length === 0 && iframeMatches.length === 0) {
    const plainText = stripHtml(sanitizedHtml);
    return plainText ? [{ type: 'text', text: plainText }] : [];
  }

  const blocks = [];
  let lastIndex = 0;

  const pushTextBetween = (from, to) => {
    const beforeText = stripHtml(sanitizedHtml.slice(from, to));
    if (beforeText) {
      blocks.push({ type: 'text', text: beforeText });
    }
  };

  const matches = [
    ...imageMatches.map((match) => ({ kind: 'image', match })),
    ...iframeMatches.map((match) => ({ kind: 'iframe', match })),
  ].sort((a, b) => Number(a.match.index || 0) - Number(b.match.index || 0));

  matches.forEach(({ kind, match }) => {
    const tag = match[0];
    const tagIndex = Number(match.index || 0);
    pushTextBetween(lastIndex, tagIndex);

    const tagUrl = getAttribute(tag, 'src');
    if (tagUrl) {
      if (kind === 'image') {
        blocks.push({
          type: 'image',
          url: tagUrl,
          alt: getAttribute(tag, 'alt'),
        });
      } else if (kind === 'iframe') {
        blocks.push({
          type: 'video',
          url: tagUrl,
          title: getAttribute(tag, 'title') || 'YouTube video',
        });
      }
    }

    lastIndex = tagIndex + tag.length;
  });

  const tailText = stripHtml(sanitizedHtml.slice(lastIndex));
  if (tailText) {
    blocks.push({ type: 'text', text: tailText });
  }

  return blocks;
};

const normalizeRichBlock = (block) => {
  if (!block || typeof block !== 'object') {
    return [];
  }

  const type = String(block.type || 'text').toLowerCase();

  if (type === 'text') {
    return normalizeHtmlTextBlock(block.text);
  }

  if (type === 'image') {
    const url = String(block.url ?? '').trim();
    if (!url) {
      return [];
    }

    return [{
      type: 'image',
      url,
      alt: String(block.alt ?? '').trim(),
    }];
  }

  if (type === 'video') {
    const url = String(block.url ?? '').trim();
    if (!url) {
      return [];
    }

    return [{
      type: 'video',
      url,
      title: String(block.title ?? '').trim(),
    }];
  }

  return [];
};

const normalizeRichBlocks = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeRichBlock).filter(Boolean);
};

const richBlocksToPlainText = (blocks = []) => blocks.map((block) => {
  if (!block || typeof block !== 'object') {
    return '';
  }

  if (block.type === 'text') {
    return String(block.text || '').trim();
  }

  if (block.type === 'image') {
    return `[Ảnh: ${String(block.alt || block.url || '').trim()}]`;
  }

  if (block.type === 'video') {
    return `[Video: ${String(block.title || block.url || '').trim()}]`;
  }

  return '';
}).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

module.exports = {
  normalizeRichBlocks,
  richBlocksToPlainText,
};