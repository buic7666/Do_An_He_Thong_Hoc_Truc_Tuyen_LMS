const { sequelize } = require('../src/config/database');

async function main() {
  const [rows] = await sequelize.query(
    'SELECT id, content, metadata FROM questions WHERE lecture_id = 89 ORDER BY id ASC',
  );

  for (const row of rows) {
    console.log(JSON.stringify({
      id: row.id,
      content: row.content,
      metadataType: typeof row.metadata,
      metadata: row.metadata,
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});