const { sequelize } = require('../src/config/database');
const models = require('../src/models');

async function repairMissingQuestionRefs() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Repairing lesson segments...');

    const { LessonSegment, Question } = models;

    const segments = await LessonSegment.findAll({ attributes: ['id', 'title', 'contentItems'] });

    // gather all referenced ids
    const referenced = new Map();
    for (const seg of segments) {
      const raw = seg.contentItems;
      let items = [];
      try { items = Array.isArray(raw) ? raw : JSON.parse(raw || '[]'); } catch (e) { items = []; }
      for (const item of items) {
        if (!item) continue;
        const qids = Array.isArray(item.questionIds) ? item.questionIds : [];
        for (const q of qids) {
          const id = Number(q);
          if (!Number.isFinite(id)) continue;
          if (!referenced.has(id)) referenced.set(id, new Set());
          referenced.get(id).add(seg.id);
        }
      }
    }

    const allIds = Array.from(referenced.keys());
    if (!allIds.length) {
      console.log('No referenced question IDs found; nothing to repair.');
      return process.exit(0);
    }

    const existing = await Question.findAll({ where: { id: allIds }, attributes: ['id'] });
    const existingIds = new Set(existing.map((r) => Number(r.id)));

    const missing = allIds.filter((id) => !existingIds.has(Number(id)));
    if (!missing.length) {
      console.log('No missing question IDs to repair.');
      return process.exit(0);
    }

    console.log('Missing IDs to remove:', missing.join(', '));

    // For each segment, remove missing IDs from its contentItems and update
    let updatedCount = 0;
    for (const seg of segments) {
      const raw = seg.contentItems;
      let items = [];
      try { items = Array.isArray(raw) ? raw : JSON.parse(raw || '[]'); } catch (e) { items = []; }
      let changed = false;
      for (const item of items) {
        if (!item || !Array.isArray(item.questionIds)) continue;
        const orig = Array.from(item.questionIds || []).map((x) => Number(x));
        const filtered = orig.filter((id) => !missing.includes(id));
        if (filtered.length !== orig.length) {
          item.questionIds = filtered;
          // also adjust questionTitles if present
          if (Array.isArray(item.questionTitles)) {
            // keep titles for remaining ids by index where possible
            const nextTitles = [];
            for (let i = 0; i < orig.length; i++) {
              if (filtered.includes(orig[i])) {
                if (item.questionTitles[i]) nextTitles.push(item.questionTitles[i]);
              }
            }
            item.questionTitles = nextTitles;
          }
          changed = true;
        }
      }

      if (changed) {
        await LessonSegment.update({ contentItems: JSON.stringify(items) }, { where: { id: seg.id } });
        console.log(`Updated segment ${seg.id} (${seg.title || 'no-title'})`);
        updatedCount++;
      }
    }

    console.log(`Repair complete. Segments updated: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Repair error:', err);
    process.exit(2);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
}

repairMissingQuestionRefs();
