const fs = require('fs');
const path = require('path');
const { HttpError } = require('../utils/httpError');
const { successResponse } = require('../utils/response');

const isAllowed = (type, mime) => {
  if (type === 'video') {
    return mime === 'video/mp4';
  }

  if (type === 'document') {
    return mime === 'application/pdf';
  }

  return mime.startsWith('image/');
};

const normalizeType = (rawType) => {
  if (rawType === 'video') return 'video';
  if (rawType === 'document') return 'document';
  return 'image';
};

const uploadTeacherAsset = async (req, res, next) => {
  try {
    const type = normalizeType(req.query.type);
    const file = req.file;

    if (!file) {
      throw new HttpError(400, 'Missing file upload', 'VALIDATION_ERROR');
    }

    if (!isAllowed(type, file.mimetype)) {
      fs.unlinkSync(file.path);
      throw new HttpError(400, 'Invalid file type for this upload', 'VALIDATION_ERROR');
    }

    const fileName = path.basename(file.path);
    const publicFolder = type === 'video' ? 'videos' : type === 'document' ? 'documents' : 'images';
    const publicPath = `/uploads/${publicFolder}/${fileName}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return successResponse(
      res,
      'File uploaded successfully',
      {
        type,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: publicPath,
        url: `${baseUrl}${publicPath}`,
      },
      201,
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadTeacherAsset,
};
