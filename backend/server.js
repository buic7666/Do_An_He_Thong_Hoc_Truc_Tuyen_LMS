require('dotenv').config();

const { env } = require('./src/config/env');
const { createApp } = require('./src/app');
const { sequelize } = require('./src/config/database');
const {
  ContactMessage,
  TeacherProfile,
  TeacherQuestion,
  TeacherInteraction,
  LessonWatchPosition,
  LessonSegment,
  LessonLabel,
} = require('./src/models');

const app = createApp();

const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    await ContactMessage.sync();
    await TeacherProfile.sync();
    await TeacherQuestion.sync();
    await TeacherInteraction.sync();
    await LessonWatchPosition.sync();
    await LessonSegment.sync();
    await LessonLabel.sync({ alter: true });

    app.listen(env.port, () => {
      console.log(`Backend server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
};

bootstrap();