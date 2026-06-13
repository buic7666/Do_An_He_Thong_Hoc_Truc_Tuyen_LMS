const fs = require('fs'); const file = process.argv[2]; const content = fs.readFileSync(0, 'utf-8'); fs.writeFileSync(file, content);
