const { sequelize } = require('../src/config/database');
require('../src/models');
const questionService = require('../src/services/questionService');

async function main() {
  await sequelize.authenticate();
  console.log('DB connected');

  const creatorId = 1; // assumes seeded user with id=1 exists

  // 1) Create CLOZE parent
  const parentPayload = {
    type: 'CLOZE',
    content: 'Câu hỏi bài đọc ví dụ',
    metadata: {
      text_template: 'Thủ đô Việt Nam là [inputs.q1]. 2+2 = [inputs.q2].',
      inner_questions: {
        q1: {
          type: 'MULTIPLE_CHOICE',
          points: 1,
          options: ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'],
          correctIndices: [0],
        },
        q2: {
          type: 'SHORT_ANSWER',
          points: 1,
          acceptedAnswers: ['4'],
        },
      },
    },
    isPublished: true,
    courseId: 1,
  };

  const parent = await questionService.createQuestion(parentPayload, creatorId);
  console.log('Created CLOZE parent id=', parent.id);

  // 2) Create child questions explicitly (mirrors inner_questions)
  const child1 = await questionService.createQuestion({
    type: 'MULTIPLE_CHOICE',
    content: 'Thủ đô Việt Nam là',
    options: ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'],
    correctIndices: [0],
    parentQuestionId: parent.id,
    orderIndex: 1,
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created child1 id=', child1.id);

  const child2 = await questionService.createQuestion({
    type: 'SHORT_ANSWER',
    content: '2+2 =',
    acceptedAnswers: ['4'],
    parentQuestionId: parent.id,
    orderIndex: 2,
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created child2 id=', child2.id);

  // 3) Create additional standalone question types
  const mcq = await questionService.createQuestion({
    type: 'MULTIPLE_CHOICE',
    content: 'Màu cờ Việt Nam chủ yếu là?',
    options: ['Đỏ', 'Xanh', 'Vàng'],
    correctIndices: [0],
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created MCQ id=', mcq.id);

  const tf = await questionService.createQuestion({
    type: 'TRUE_FALSE',
    content: 'Trái đất quay quanh mặt trời.',
    correctAnswer: true,
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created TRUE_FALSE id=', tf.id);

  const sa = await questionService.createQuestion({
    type: 'SHORT_ANSWER',
    content: 'Viết tên quốc kỳ của Việt Nam.',
    acceptedAnswers: ['Quốc kỳ Việt Nam', 'Cờ đỏ sao vàng', 'Cờ đỏ sao vàng'],
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created SHORT_ANSWER id=', sa.id);

  const essay = await questionService.createQuestion({
    type: 'ESSAY',
    content: 'Viết một đoạn ngắn về văn hoá Việt Nam.',
    instructions: 'Tối thiểu 200 từ.',
    rubric: [{ name: 'Nội dung', weight: 70, description: 'Đúng chủ đề' }, { name: 'Ngôn ngữ', weight: 30, description: 'Rõ ràng, mạch lạc' }],
    wordLimit: { min: 100, max: 1000 },
    isPublished: true,
    courseId: 1,
  }, creatorId);
  console.log('Created ESSAY id=', essay.id);

  console.log('All sample questions created successfully.');
  await sequelize.close();
}

main().catch((err) => {
  console.error('Error creating sample questions:', err && err.message ? err.message : err);
  process.exit(1);
});
