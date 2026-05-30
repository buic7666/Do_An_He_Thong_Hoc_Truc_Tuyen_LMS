const { Question } = require('../src/models');

async function main() {
  const rows = await Question.findAll({
    where: { lectureId: 89 },
    order: [['id', 'ASC']],
  });

  for (const question of rows) {
    const metadata = question.metadata && typeof question.metadata === 'object'
      ? question.metadata
      : {};

    const blocks = Array.isArray(question.contentBlocks)
      ? question.contentBlocks
      : Array.isArray(metadata.contentBlocks)
        ? metadata.contentBlocks
        : [];

    console.log(JSON.stringify({
      id: question.id,
      content: question.content,
      blocks,
      options: metadata.options || question.options || [],
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});