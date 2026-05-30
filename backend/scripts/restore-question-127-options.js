const { sequelize } = require('../src/config/database');
const { Question } = require('../src/models');
const quizService = require('../src/services/quizService');

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

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const quiz = await quizService.getQuizDetail(45);
    const qlist = quiz.questions.map(q => q.id);
    console.log('Quiz question ids:', qlist);

    // collect candidate options from other questions
    const candidateSet = new Set();
    for (const id of qlist) {
      if (id === 127) continue;
      try {
        // require questionService
        const qs = require('../src/services/questionService');
        const q = await qs.getQuestionById(id);
        if (Array.isArray(q.options)) q.options.forEach(o => candidateSet.add(String(o).trim()));
      } catch (e) {
        // ignore
      }
    }

    // ensure Cole Palmer present
    const target = 'Cole Palmer';
    candidateSet.add(target);

    const candidates = Array.from(candidateSet).filter(Boolean).slice(0, 4);

    // pad if less than 4
    while (candidates.length < 4) {
      candidates.push(`Option ${candidates.length + 1}`);
    }

    // put Cole Palmer at index 0 for correct
    const ordered = [target, ...candidates.filter(c => c !== target)].slice(0, 4);
    const correctIndex = ordered.indexOf(target);

    // update question 127 metadata
    const q127 = await Question.findOne({ where: { id: 127 } });
    const plain = q127.toJSON();
    const meta = parseMeta(plain.metadata);
    meta.options = ordered;
    meta.correctIndices = [correctIndex];

    await q127.update({ metadata: meta });
    console.log('Updated question 127 with options:', ordered, 'correctIndex:', correctIndex);

    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  }
}

main();
