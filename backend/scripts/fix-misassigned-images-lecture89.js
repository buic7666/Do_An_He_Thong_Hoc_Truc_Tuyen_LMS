const { sequelize } = require('../src/config/database');
const { Question } = require('../src/models');
const { normalizeRichBlocks } = require('../src/utils/richContent');

const extractImageFromHtml = (html) => {
  if (!html || typeof html !== 'string') return null;
  try {
    const m = html.match(/<img[^>]+src=["']?([^"' >]+)["']?[^>]*>/i);
    if (m && m[1]) return m[1];
  } catch (e) {}
  return null;
};

const findFirstImageUrl = (text) => {
  if (!text) return null;
  // data URI or uploads path or file extensions
  const dataMatch = text.match(/(data:image\/[a-zA-Z0-9.+-]+;base64,[^\s"'>]+)/i);
  if (dataMatch) return dataMatch[1];

  const urlMatch = text.match(/(https?:\/\/[^\s"'>]+\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?[^\s"'>]*)?)/i);
  if (urlMatch) return urlMatch[1];

  // fallback: look for /uploads/images/ paths
  const upMatch = text.match(/(\/uploads\/images\/[^\s"'>]+)/i);
  if (upMatch) return upMatch[1].startsWith('/') ? (`http://localhost:5000${upMatch[1]}`) : upMatch[1];

  return null;
};

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const rows = await Question.findAll({ where: { lectureId: 89 }, order: [['id', 'ASC']] });
    let updated = 0;

    for (const q of rows) {
      const plain = q.toJSON();
      const meta = (plain.metadata && typeof plain.metadata === 'object') ? plain.metadata : (typeof plain.metadata === 'string' ? (() => { try { return JSON.parse(plain.metadata); } catch { return {}; } })() : {});
      const existingBlocks = Array.isArray(plain.contentBlocks) ? plain.contentBlocks : (Array.isArray(meta.contentBlocks) ? meta.contentBlocks : []);

      if (Array.isArray(existingBlocks) && existingBlocks.length > 0) {
        // nothing to do
        continue;
      }

      // Try candidate sources in order
      let candidateUrl = null;

      // 1) metadata.contentBlocks
      if (Array.isArray(meta.contentBlocks) && meta.contentBlocks.length > 0) {
        const imgs = meta.contentBlocks.filter(b => b && String(b.type||'').toLowerCase() === 'image').map(b => b.url).filter(Boolean);
        if (imgs.length) candidateUrl = imgs[0];
      }

      // 2) metadata.blocks or richContent
      if (!candidateUrl && Array.isArray(meta.blocks) && meta.blocks.length > 0) {
        const imgs = meta.blocks.filter(b => b && String(b.type||'').toLowerCase() === 'image').map(b => b.url).filter(Boolean);
        if (imgs.length) candidateUrl = imgs[0];
      }
      if (!candidateUrl && meta.richContent && Array.isArray(meta.richContent.blocks)) {
        const imgs = meta.richContent.blocks.filter(b => b && String(b.type||'').toLowerCase() === 'image').map(b => b.url).filter(Boolean);
        if (imgs.length) candidateUrl = imgs[0];
      }

      // 3) metadata as HTML string
      if (!candidateUrl && typeof plain.metadata === 'string') {
        candidateUrl = extractImageFromHtml(plain.metadata) || findFirstImageUrl(plain.metadata);
      }

      // 4) question content
      if (!candidateUrl && plain.content) {
        candidateUrl = extractImageFromHtml(plain.content) || findFirstImageUrl(plain.content);
      }

      if (candidateUrl) {
        const normalizedBlocks = normalizeRichBlocks([{ type: 'image', url: candidateUrl, alt: '' }]);
        meta.contentBlocks = normalizedBlocks;

        // persist via model instance update
        try {
          await q.update({ metadata: meta });
          console.log(`Updated question ${plain.id} -> ${candidateUrl}`);
          updated += 1;
        } catch (e) {
          console.warn(`Failed to update question ${plain.id}:`, e.message || e);
        }
      } else {
        console.log(`No image found for question ${plain.id}; skipping`);
      }
    }

    console.log(`Done. Updated ${updated} questions.`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

main();
