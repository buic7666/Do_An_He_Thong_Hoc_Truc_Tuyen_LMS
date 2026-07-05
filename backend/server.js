require('dotenv').config();

const { env } = require('./src/config/env');
const { createApp } = require('./src/app');
const { sequelize } = require('./src/config/database');
const {
  ContactMessage,
  TeacherProfile,
  TeacherInteraction,
  LessonWatchPosition,
  LessonSegment,
  LessonLabel,
  SystemSetting,
  SystemCategory,
} = require('./src/models');
const app = createApp();

const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    try {
      await sequelize.query("UPDATE lesson_segments SET content_items = JSON_ARRAY() WHERE content_items IS NULL");
      await sequelize.query("UPDATE lesson_segments SET order_index = id WHERE order_index IS NULL OR order_index = 0");
    } catch (cleanupError) {
      console.warn('Skipping lesson_segments cleanup before sync:', cleanupError.message);
    }
    await ContactMessage.sync();
    await TeacherProfile.sync();
    await TeacherInteraction.sync();
    await LessonWatchPosition.sync({ alter: true });
    await LessonSegment.sync();
    await SystemSetting.sync();
    await SystemCategory.sync();

    try {
      await LessonLabel.sync({ alter: true });
    } catch (syncError) {
      console.warn('Skipping lesson_labels alter sync:', syncError.message);
    }

    app.listen(env.port, () => {
      console.log(`Backend server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
};

bootstrap();
