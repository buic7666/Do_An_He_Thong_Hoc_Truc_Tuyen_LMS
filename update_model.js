const fs = require('fs');
const file = 'backend/src/models/lesson.model.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /    chapterId: \{\s*type: DataTypes\.BIGINT\.UNSIGNED,\s*allowNull: true,\s*field: 'chapter_id',\s*comment: 'Chương mà bài giảng này thuộc về',\s*\},\s*\},/g;

const newStr = `    chapterId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'chapter_id',
      comment: 'Chương mà bài giảng này thuộc về',
    },
    approvalStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'APPROVED',
      field: 'approvalStatus',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'approved',
      field: 'status',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'isPublished',
    },
  },`;

if (regex.test(content)) {
    content = content.replace(regex, newStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Model updated successfully.');
} else {
    console.log('Regex not matched.');
}
