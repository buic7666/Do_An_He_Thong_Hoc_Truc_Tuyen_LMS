const { sequelize } = require('../config/database');
const { Question, Quiz, QuizQuestion, Course } = require('../models');

const run = async () => {
  try {
    await sequelize.authenticate();

    const cloze = await Question.findOne({ where: { type: 'CLOZE' } });
    if (!cloze) {
      console.log('No CLOZE question found.');
      await sequelize.close();
      process.exit(0);
    }

    const courseId = cloze.courseId || (await Course.findOne()).id;
    if (!courseId) {
      console.log('No course available to attach quiz to.');
      await sequelize.close();
      process.exit(0);
    }

    const quiz = await Quiz.create({
      courseId,
      title: 'E2E CLOZE Test',
      description: 'Auto-generated quiz for CLOZE E2E testing',
      duration: 30,
      passScore: 50,
      maxAttempts: 3,
      isPublished: true,
      createdBy: 1,
    });

    await QuizQuestion.create({ quizId: quiz.id, questionId: cloze.id, order: 1, points: 1 });

    console.log(`Created quiz id=${quiz.id} with CLOZE question id=${cloze.id}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating cloze quiz:', error);
    await sequelize.close();
    process.exit(1);
  }
};

run();
