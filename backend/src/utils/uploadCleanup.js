const fs = require('fs/promises');
const path = require('path');

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');

const LOCAL_UPLOAD_REGEX =
  /(?:https?:\/\/[^/\s"'<>]+(?::\d+)?)?\/uploads\/(?:images|videos|documents)\/[^"'<>?\s)]+(?:\?[^"'<>\s)]*)?/gi;

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const normalizeLocalUploadPath = (rawValue) => {
  if (!rawValue) return null;

  const text = safeDecode(String(rawValue).trim())
    .replace(/\\/g, '/')
    .split(/[?#]/)[0];

  const match = text.match(/\/uploads\/(?:images|videos|documents)\/.+$/i);

  if (!match) return null;

  const relativePath = match[0].replace(/\\/g, '/');

  if (relativePath.includes('..')) {
    return null;
  }

  const insideUploads = relativePath.replace(/^\/uploads\//i, '');
  const absolutePath = path.resolve(UPLOAD_ROOT, insideUploads);

  if (
    absolutePath !== UPLOAD_ROOT
    && !absolutePath.startsWith(UPLOAD_ROOT + path.sep)
  ) {
    return null;
  }

  return {
    relativePath,
    absolutePath,
  };
};

const addUploadPathFromString = (value, fileMap) => {
  const text = String(value || '');

  const directPath = normalizeLocalUploadPath(text);
  if (directPath) {
    fileMap.set(directPath.relativePath, directPath);
  }

  const matches = text.matchAll(LOCAL_UPLOAD_REGEX);

  for (const match of matches) {
    const fileInfo = normalizeLocalUploadPath(match[0]);

    if (fileInfo) {
      fileMap.set(fileInfo.relativePath, fileInfo);
    }
  }
};

const walkValue = (value, fileMap, visited = new WeakSet()) => {
  if (value == null) return;

  if (typeof value === 'string') {
    addUploadPathFromString(value, fileMap);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => walkValue(item, fileMap, visited));
    return;
  }

  if (typeof value === 'object') {
    if (visited.has(value)) return;
    visited.add(value);

    Object.values(value).forEach((item) => walkValue(item, fileMap, visited));
  }
};

const collectLocalUploadFiles = (...values) => {
  const fileMap = new Map();

  values.forEach((value) => {
    walkValue(value, fileMap);
  });

  return Array.from(fileMap.values());
};

const deleteLocalUploadFiles = async (files = []) => {
  const deleted = [];

  for (const file of files) {
    try {
      await fs.unlink(file.absolutePath);
      deleted.push(file.relativePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.warn(
          `[uploadCleanup] Không thể xóa file ${file.relativePath}:`,
          error.message,
        );
      }
    }
  }

  return deleted;
};

module.exports = {
  collectLocalUploadFiles,
  deleteLocalUploadFiles,
};