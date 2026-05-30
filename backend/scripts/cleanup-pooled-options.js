const { sequelize } = require('../src/config/database');
const { Question } = require('../src/models');

const parseMeta = (m) => {
  if (!m) return {};
  if (typeof m === 'string') {
    try {
      let parsed = m;
      for (let i = 0; i < 2; i++) {
        parsed = JSON.parse(parsed);
      }
      return typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      try { return JSON.parse(m); } catch (_) { return {}; }
    }
  }
  return m;
};

const richBlocksToPlain = (blocks = []) => {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(b => {
    if (!b || typeof b !== 'object') return '';
    if (typeof b.text === 'string') return b.text;
    if (typeof b.content === 'string') return b.content;
    return '';
  }).join(' ').replace(/\s+/g, ' ').trim();
};

const textForQuestion = (plain, meta) => {
  const candidates = [];
  if (plain.questionText) candidates.push(String(plain.questionText));
  if (plain.content) candidates.push(String(plain.content));
  if (meta && meta.questionText) candidates.push(String(meta.questionText));
  if (meta && meta.title) candidates.push(String(meta.title));
  if (Array.isArray(meta?.contentBlocks)) candidates.push(richBlocksToPlain(meta.contentBlocks));
  if (Array.isArray(plain?.contentBlocks)) candidates.push(richBlocksToPlain(plain.contentBlocks));
  return candidates.join(' ').replace(/\s+/g, ' ').toLowerCase();
};

const optionToText = (opt) => {
  if (opt == null) return '';
  if (typeof opt === 'string') return opt.trim();
  if (typeof opt === 'number') return String(opt);
  if (typeof opt === 'object') {
    if (typeof opt.text === 'string' && opt.text.trim()) return opt.text.trim();
    if (Array.isArray(opt.contentBlocks)) return richBlocksToPlain(opt.contentBlocks);
    if (Array.isArray(opt.blocks)) return richBlocksToPlain(opt.blocks);
    if (typeof opt.label === 'string' && opt.label.trim()) return opt.label.trim();
  }
  return '';
};

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2).map((s) => Number(s)) : [127];
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    for (const id of ids) {
      const q = await Question.findOne({ where: { id } });
      if (!q) {
        console.warn('Question not found:', id);
        continue;
      }
      const plain = q.toJSON();
      const meta = parseMeta(plain.metadata);

      const originalOptions = Array.isArray(plain.options) ? plain.options : (Array.isArray(meta.options) ? meta.options : []);

      // Build text context for the question to see if option text appears there
      const context = textForQuestion(plain, meta);

      // If plain.options exists, prefer it (it's authoritative)
      let newOptions = [];
      if (Array.isArray(plain.options) && plain.options.length > 0) {
        newOptions = plain.options.map(optionToText).filter(Boolean);
      } else if (Array.isArray(meta.options) && meta.options.length > 0) {
        // Keep only options that seem to belong to this question: either they appear in question text
        // or they contain an image/markup or are objects with contentBlocks.
        newOptions = meta.options.filter((opt) => {
          const txt = String(optionToText(opt) || '').toLowerCase();
          if (!txt) return false;
          // If option appears verbatim in the question context, keep it
          if (context && context.includes(txt)) return true;
          // If option contains an image URL or upload path, keep it
          if (/\/(uploads|static)\/|https?:\/\//i.test(txt)) return true;
          // Small heuristic: if option is short (<3 chars) and unlikely, drop it
          if (txt.length < 2) return false;
          // Otherwise drop it — avoid pooled options
          return false;
        }).map(optionToText).filter(Boolean);
      }

      // If no options remain, remove options field to avoid showing pooled data
      if (!newOptions || newOptions.length === 0) {
        if (meta && meta.options) delete meta.options;
        if (meta && meta.correctIndices) delete meta.correctIndices;
        await q.update({ metadata: meta });
        console.log(`Question ${id}: cleared pooled options (no authoritative options found).`);
        continue;
      }

      // compute correctIndices: try to keep existing correctIndices if the correct option text still exists
      let correctIndices = Array.isArray(meta.correctIndices) ? meta.correctIndices.slice() : [];
      if ((!correctIndices || correctIndices.length === 0) && typeof meta.correctIndex === 'number') {
        correctIndices = [meta.correctIndex];
      }

      // Normalize correctIndices to match newOptions mapping (by comparing texts)
      const oldOptionsText = (Array.isArray(meta.options) ? meta.options : []).map(optionToText);
      const mappedCorrect = [];
      if (correctIndices && correctIndices.length) {
        correctIndices.forEach((ci) => {
          const oldText = String(oldOptionsText[ci] || '').trim();
          if (!oldText) return;
          const newIndex = newOptions.findIndex((no) => String(no).trim() === oldText);
          if (newIndex >= 0) mappedCorrect.push(newIndex);
        });
      }

      meta.options = newOptions;
      if (mappedCorrect.length > 0) {
        meta.correctIndices = mappedCorrect;
      } else if (typeof meta.correctIndex === 'number') {
        // fallback: try to keep same index if within bounds
        if (meta.correctIndex >= 0 && meta.correctIndex < newOptions.length) {
          meta.correctIndices = [meta.correctIndex];
        } else {
          delete meta.correctIndices;
          delete meta.correctIndex;
        }
      } else {
        delete meta.correctIndices;
      }

      await q.update({ metadata: meta });
      console.log(`Question ${id}: set metadata.options = [${meta.options.join(', ')}]`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
