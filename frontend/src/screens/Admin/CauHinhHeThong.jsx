import { useEffect, useState } from 'react';

import './CauHinhHeThong.css';
import AdminSidebar from '../../components/AdminSidebar';
import {
  createSystemCategoryApi,
  deleteSystemCategoryApi,
  fetchSystemCategoriesApi,
  fetchSystemSettingsApi,
  updateSystemCategoryApi,
  updateSystemSettingsApi,
} from '../../api/adminApi';

const defaultSettings = {
  maxUploadMb: 500,
  platformCommission: 20,
  paymentApiKey: '',
};

const getErrorMessage = (error) => (
  error?.response?.data?.message
  || error?.response?.data?.error
  || error?.message
  || 'Đã xảy ra lỗi, vui lòng thử lại.'
);

const normalizeSettings = (data) => ({
  maxUploadMb: Number(data?.maxUploadMb ?? defaultSettings.maxUploadMb),
  platformCommission: Number(data?.platformCommission ?? defaultSettings.platformCommission),
  paymentApiKey: data?.paymentApiKey ?? '',
});

const normalizeCategories = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((item, index) => ({
    id: item.id ?? index + 1,
    name: item.name ?? '',
    isActive: item.isActive ?? true,
  }));
};

function CauHinhHeThong() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(defaultSettings);
  const [categories, setCategories] = useState([]);

  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessage = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const loadSettings = async () => {
    const data = await fetchSystemSettingsApi();
    setSettings(normalizeSettings(data));
  };

  const loadCategories = async () => {
    const data = await fetchSystemCategoriesApi();
    setCategories(normalizeCategories(data));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      clearMessage();

      await Promise.all([
        loadSettings(),
        loadCategories(),
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: name === 'paymentApiKey' ? value : value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      clearMessage();

      const payload = {
        maxUploadMb: Number(settings.maxUploadMb),
        platformCommission: Number(settings.platformCommission),
        paymentApiKey: settings.paymentApiKey,
      };

      if (!Number.isFinite(payload.maxUploadMb) || payload.maxUploadMb <= 0) {
        setErrorMessage('Dung lượng upload tối đa phải lớn hơn 0.');
        return;
      }

      if (
        !Number.isFinite(payload.platformCommission)
        || payload.platformCommission < 0
        || payload.platformCommission > 100
      ) {
        setErrorMessage('Tỷ lệ hoa hồng nền tảng phải nằm trong khoảng 0 - 100.');
        return;
      }

      setIsSavingSettings(true);

      const updatedSettings = await updateSystemSettingsApi(payload);
      setSettings(normalizeSettings(updatedSettings));
      setSuccessMessage('Đã lưu cấu hình hệ thống thành công.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSubmitCategory = async () => {
    try {
      clearMessage();

      const name = editingCategoryId ? editingCategoryName.trim() : categoryName.trim();

      if (!name) {
        setErrorMessage('Tên chuyên ngành không được để trống.');
        return;
      }

      setIsSavingCategory(true);

      if (editingCategoryId) {
        await updateSystemCategoryApi(editingCategoryId, name);
        setSuccessMessage('Đã cập nhật chuyên ngành thành công.');
      } else {
        await createSystemCategoryApi(name);
        setSuccessMessage('Đã thêm chuyên ngành mới thành công.');
      }

      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleStartEditCategory = (category) => {
    clearMessage();
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa chuyên ngành "${category.name}" không?`);

    if (!confirmed) return;

    try {
      clearMessage();

      await deleteSystemCategoryApi(category.id);
      setSuccessMessage('Đã xóa chuyên ngành thành công.');

      if (editingCategoryId === category.id) {
        resetCategoryForm();
      }

      await loadCategories();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="system-config-page">
      <AdminSidebar />

      <main className="system-config-main-content">
        <h1 className="system-config-page-title">Thiết lập hệ thống</h1>

        <div className="system-config-settings-card">
          <div className="system-config-tab-labels">
            <button
              className={`system-config-tab-label ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => {
                clearMessage();
                setActiveTab('general');
              }}
              type="button"
            >
              Cài đặt chung
            </button>

            <button
              className={`system-config-tab-label ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => {
                clearMessage();
                setActiveTab('categories');
              }}
              type="button"
            >
              Danh mục chuyên ngành
            </button>
          </div>

          {errorMessage && (
            <div className="system-config-alert system-config-alert-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="system-config-alert system-config-alert-success">
              {successMessage}
            </div>
          )}

          {isLoading ? (
            <div className="system-config-loading">Đang tải cấu hình hệ thống...</div>
          ) : activeTab === 'general' ? (
            <div className="system-config-tab-panel">
              <div className="system-config-form-group">
                <label className="system-config-form-label" htmlFor="maxUploadMb">
                  Dung lượng upload tối đa (MB)
                </label>
                <input
                  className="system-config-form-control"
                  id="maxUploadMb"
                  min="1"
                  name="maxUploadMb"
                  onChange={handleInputChange}
                  type="number"
                  value={settings.maxUploadMb}
                />
              </div>

              <div className="system-config-form-group">
                <label className="system-config-form-label" htmlFor="platformCommission">
                  Tỷ lệ hoa hồng nền tảng (%)
                </label>
                <input
                  className="system-config-form-control"
                  id="platformCommission"
                  max="100"
                  min="0"
                  name="platformCommission"
                  onChange={handleInputChange}
                  type="number"
                  value={settings.platformCommission}
                />
              </div>

              <div className="system-config-form-group">
                <label className="system-config-form-label" htmlFor="paymentApiKey">
                  API Key cổng thanh toán (VNPAY/MoMo)
                </label>
                <input
                  className="system-config-form-control"
                  id="paymentApiKey"
                  name="paymentApiKey"
                  onChange={handleInputChange}
                  placeholder="Nhập API key cổng thanh toán"
                  type="text"
                  value={settings.paymentApiKey}
                />
              </div>

              <button
                className="system-config-btn system-config-btn-primary"
                disabled={isSavingSettings}
                onClick={handleSaveSettings}
                type="button"
              >
                {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình hệ thống'}
              </button>
            </div>
          ) : (
            <div className="system-config-tab-panel">
              <div className="system-config-category-header">
                <p className="system-config-category-note">
                  Quản lý các chuyên ngành đào tạo trên nền tảng.
                </p>
              </div>

              <div className="system-config-category-form">
                <input
                  className="system-config-form-control"
                  onChange={(event) => setCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSubmitCategory();
                    }
                  }}
                  placeholder="Nhập tên chuyên ngành"
                  type="text"
                  value={categoryName}
                />

                <button
                  className="system-config-btn system-config-btn-success"
                  disabled={isSavingCategory}
                  onClick={handleSubmitCategory}
                  type="button"
                >
                  {isSavingCategory ? 'Đang thêm...' : '+ Thêm chuyên ngành'}
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="system-config-empty">
                  Chưa có chuyên ngành nào.
                </div>
              ) : (
                <ul className="system-config-category-list">
                  {categories.map((category) => (
                    <li className="system-config-category-item" key={category.id}>
                      {editingCategoryId === category.id ? (
                        <input
                          className="system-config-form-control"
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleSubmitCategory();
                            }

                            if (event.key === 'Escape') {
                              resetCategoryForm();
                            }
                          }}
                          type="text"
                          value={editingCategoryName}
                        />
                      ) : (
                        <span className="system-config-category-name">
                          {category.name}
                        </span>
                      )}

                      <div className="system-config-category-actions">
                        {editingCategoryId === category.id ? (
                          <>
                            <button
                              className="system-config-btn system-config-btn-outline system-config-btn-sm"
                              disabled={isSavingCategory}
                              onClick={handleSubmitCategory}
                              type="button"
                            >
                              Lưu
                            </button>

                            <button
                              className="system-config-btn system-config-btn-outline system-config-btn-sm"
                              disabled={isSavingCategory}
                              onClick={resetCategoryForm}
                              type="button"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="system-config-btn system-config-btn-outline system-config-btn-sm"
                              onClick={() => handleStartEditCategory(category)}
                              type="button"
                            >
                              Sửa
                            </button>

                            <button
                              className="system-config-btn system-config-btn-outline system-config-btn-sm system-config-btn-danger"
                              onClick={() => handleDeleteCategory(category)}
                              type="button"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CauHinhHeThong;