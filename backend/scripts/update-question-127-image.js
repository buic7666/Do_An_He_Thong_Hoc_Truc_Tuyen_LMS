const { Question } = require('../src/models');

const IMAGE_URL = 'http://localhost:5000/uploads/images/palmer-1780108013559-845373450.webp';

async function main() {
  const question = await Question.findByPk(127);

  if (!question) {
    throw new Error('Question 127 not found');
  }

  const metadata = question.metadata && typeof question.metadata === 'object'
    ? { ...question.metadata }
    : {};

  metadata.contentBlocks = [
    {
      type: 'image',
      url: IMAGE_URL,
      alt: '',
    },
  ];

  await question.update({ metadata });

  console.log('Updated question 127 metadata.contentBlocks');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});