const fs = require('fs');
const { Question } = require('../src/models');

async function main() {
  const rows = await Question.findAll({
    where: { lectureId: 89 },
    order: [['id', 'ASC']],
  });

  const payload = rows.map((question) => {
    const metadata = question.metadata && typeof question.metadata === 'object'
      ? question.metadata
      : {};

    const blocks = Array.isArray(question.contentBlocks)
      ? question.contentBlocks
      : Array.isArray(metadata.contentBlocks)
        ? metadata.contentBlocks
        : [];

    const imageUrls = blocks
      .filter((block) => block && String(block.type || '').toLowerCase() === 'image')
      .map((block) => block.url)
      .filter(Boolean);

    return {
      id: question.id,
      content: question.content,
      type: question.type,
      imageUrls,
      blocks,
    };
  });

  fs.writeFileSync('lecture89-dump.json', JSON.stringify(payload, null, 2), 'utf8');
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
