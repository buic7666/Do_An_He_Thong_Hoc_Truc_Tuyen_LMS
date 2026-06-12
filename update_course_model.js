const fs = require('fs');
const file = 'backend/src/models/course.model.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /    status: \{\s*type: DataTypes\.ENUM\('pending', 'approved', 'rejected'\),\s*allowNull: false,\s*defaultValue: 'pending',\s*\},\s*\},/g;

const newStr = `    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approvalStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'APPROVED',
      field: 'approvalStatus',
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
    console.log('Course model updated successfully.');
} else {
    console.log('Regex not matched for course.');
}
