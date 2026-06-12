const { SystemSetting, SystemCategory } = require('../models');
const { HttpError } = require('../utils/httpError');

const DEFAULT_SETTINGS = {
  maxUploadMb: 500,
  platformCommission: 20,
  paymentApiKey: '',
};

const DEFAULT_CATEGORIES = [
  'Công nghệ thông tin (Software Engineering)',
  'Kinh tế & Quản trị kinh doanh',
  'Ngoại ngữ (Tiếng Anh, Tiếng Nhật)',
];

const parseSettingValue = (key, rawValue) => {
  if (key === 'maxUploadMb' || key === 'platformCommission') {
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : DEFAULT_SETTINGS[key];
  }

  return rawValue || '';
};

const ensureDefaultSettings = async () => {
  await Promise.all(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) =>
      SystemSetting.findOrCreate({
        where: { key },
        defaults: { key, value: String(value) },
      }),
    ),
  );
};

const ensureDefaultCategories = async () => {
  const count = await SystemCategory.count();

  if (count > 0) return;

  await SystemCategory.bulkCreate(
    DEFAULT_CATEGORIES.map((name) => ({
      name,
      isActive: true,
    })),
    { ignoreDuplicates: true },
  );
};

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.name,
  isActive: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const getSettings = async () => {
  await ensureDefaultSettings();

  const rows = await SystemSetting.findAll();
  const settings = { ...DEFAULT_SETTINGS };

  rows.forEach((row) => {
    settings[row.key] = parseSettingValue(row.key, row.value);
  });

  return settings;
};

const updateSettings = async (payload = {}) => {
  const nextSettings = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'maxUploadMb')) {
    const value = Number(payload.maxUploadMb);
    if (!Number.isFinite(value) || value <= 0) {
      throw new HttpError(400, 'Dung lượng upload tối đa phải lớn hơn 0', 'INVALID_MAX_UPLOAD');
    }
    nextSettings.maxUploadMb = Math.round(value);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'platformCommission')) {
    const value = Number(payload.platformCommission);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new HttpError(400, 'Tỷ lệ hoa hồng phải nằm trong khoảng 0 - 100', 'INVALID_PLATFORM_COMMISSION');
    }
    nextSettings.platformCommission = value;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'paymentApiKey')) {
    const value = String(payload.paymentApiKey || '').trim();
    if (value.length > 255) {
      throw new HttpError(400, 'API Key không được vượt quá 255 ký tự', 'INVALID_PAYMENT_API_KEY');
    }
    nextSettings.paymentApiKey = value;
  }

  await ensureDefaultSettings();

  await Promise.all(
    Object.entries(nextSettings).map(([key, value]) =>
      SystemSetting.upsert({
        key,
        value: String(value),
      }),
    ),
  );

  return getSettings();
};

const getCategories = async () => {
  await ensureDefaultCategories();

  const categories = await SystemCategory.findAll({
    where: { isActive: true },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return categories.map(normalizeCategory);
};

const createCategory = async (payload = {}) => {
  const name = String(payload.name || '').trim();

  if (!name) {
    throw new HttpError(400, 'Tên chuyên ngành không được để trống', 'INVALID_CATEGORY_NAME');
  }

  const existedCategory = await SystemCategory.findOne({ where: { name } });
  if (existedCategory) {
    if (!existedCategory.isActive) {
      existedCategory.isActive = true;
      await existedCategory.save();
      return normalizeCategory(existedCategory);
    }

    throw new HttpError(409, 'Chuyên ngành này đã tồn tại', 'CATEGORY_ALREADY_EXISTS');
  }

  const category = await SystemCategory.create({ name, isActive: true });
  return normalizeCategory(category);
};

const updateCategory = async (categoryId, payload = {}) => {
  const category = await SystemCategory.findByPk(categoryId);
  if (!category || !category.isActive) {
    throw new HttpError(404, 'Không tìm thấy chuyên ngành', 'CATEGORY_NOT_FOUND');
  }

  const name = String(payload.name || '').trim();
  if (!name) {
    throw new HttpError(400, 'Tên chuyên ngành không được để trống', 'INVALID_CATEGORY_NAME');
  }

  const duplicatedCategory = await SystemCategory.findOne({ where: { name } });
  if (duplicatedCategory && String(duplicatedCategory.id) !== String(category.id)) {
    throw new HttpError(409, 'Chuyên ngành này đã tồn tại', 'CATEGORY_ALREADY_EXISTS');
  }

  category.name = name;
  await category.save();

  return normalizeCategory(category);
};

const deleteCategory = async (categoryId) => {
  const category = await SystemCategory.findByPk(categoryId);
  if (!category || !category.isActive) {
    throw new HttpError(404, 'Không tìm thấy chuyên ngành', 'CATEGORY_NOT_FOUND');
  }

  category.isActive = false;
  await category.save();

  return { id: category.id, deleted: true };
};

module.exports = {
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};