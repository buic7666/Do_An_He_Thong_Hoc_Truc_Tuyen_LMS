const { sequelize } = require('../config/database');
const { User } = require('../models');

const run = async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ limit: 20, order: [['id', 'ASC']] });
    users.forEach(u => console.log(`${u.id}	${u.email}	${u.role}`));
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await sequelize.close();
    process.exit(1);
  }
};

run();
