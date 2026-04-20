const fs = require('fs');
const path = require('path');
const multer = require('multer');

const rootUploadDir = path.resolve(__dirname, '../../uploads');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const resolveSubfolder = (type) => {
  if (type === 'video') return 'videos';
  if (type === 'document') return 'documents';
  return 'images';
};

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const folder = resolveSubfolder(req.query.type);
    const destinationPath = path.join(rootUploadDir, folder);
    ensureDirectory(destinationPath);
    callback(null, destinationPath);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeBaseName = path
      .basename(file.originalname || 'file', extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${safeBaseName || 'file'}-${unique}${extension}`);
  },
});

const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024,
  },
}).single('file');

module.exports = {
  uploadSingleFile,
};
