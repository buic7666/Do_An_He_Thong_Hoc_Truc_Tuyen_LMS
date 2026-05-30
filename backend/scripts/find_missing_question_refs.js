const { sequelize } = require('../src/config/database');
const models = require('../src/models');

async function findMissingQuestionRefs() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Scanning lesson segments...');

    const { LessonSegment, Question } = models;

    const segments = await LessonSegment.findAll({ attributes: ['id', 'title', 'contentItems'] });

    const referenced = new Map(); // questionId => Set(segmentId)

    for (const seg of segments) {
      const raw = seg.contentItems;
      let items = [];
      try {
        items = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      } catch (e) {
        try { items = JSON.parse(String(raw)); } catch (_) { items = []; }
      }

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
      console.log('No question references found in segments.');
      return process.exit(0);
    }

    // Query existing questions
    const existing = await Question.findAll({ where: { id: allIds }, attributes: ['id'] });
    const existingIds = new Set(existing.map((r) => Number(r.id)));

    const missing = allIds.filter((id) => !existingIds.has(Number(id))).sort((a,b)=>a-b);

    if (!missing.length) {
      console.log('All referenced question IDs exist in `questions` table.');
      console.log(`Total referenced question IDs: ${allIds.length}`);
      return process.exit(0);
    }

    console.log('Found referenced question IDs that are missing in `questions` table:');
    for (const mid of missing) {
      const segmentsSet = referenced.get(mid) || new Set();
      console.log(`- Question ID ${mid} referenced in segments: ${Array.from(segmentsSet).join(', ')}`);
    }

    console.log('\nSuggested fix: review segments and remove or replace the missing question IDs in their `contentItems` JSON.');
    process.exit(0);
  } catch (err) {
    console.error('Error during scan:', err);
    process.exit(2);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
}

findMissingQuestionRefs();
