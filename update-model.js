const fs = require('fs');
let c = fs.readFileSync('backend/src/models/course.model.js', 'utf8');
c = c.replace(
  "field: 'instructor_id',\r\n    },",
  "field: 'instructor_id',\r\n    },\r\n    status: {\r\n      type: DataTypes.ENUM('pending', 'approved', 'rejected'),\r\n      allowNull: false,\r\n      defaultValue: 'pending',\r\n    },"
);
c = c.replace(
  "field: 'instructor_id',\n    },",
  "field: 'instructor_id',\n    },\n    status: {\n      type: DataTypes.ENUM('pending', 'approved', 'rejected'),\n      allowNull: false,\n      defaultValue: 'pending',\n    },"
);
fs.writeFileSync('backend/src/models/course.model.js', c);