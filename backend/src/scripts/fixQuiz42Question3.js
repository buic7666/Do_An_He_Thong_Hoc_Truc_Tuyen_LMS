const { sequelize } = require('../config/database');

(async () => {
  try {
    await sequelize.query("UPDATE quiz_questions SET question_id = 102 WHERE quiz_id = 42 AND `order` = 3");
    const [rows] = await sequelize.query("SELECT quiz_id, `order`, question_id FROM quiz_questions WHERE quiz_id=42 ORDER BY `order` ASC");
    console.table(rows);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
