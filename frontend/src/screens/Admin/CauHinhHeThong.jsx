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
fetchQuestionTypeConfigsApi,
updateQuestionTypeConfigApi,
} from '../../api/adminApi';

const defaultSettings = {
maxUploadMb: 500,
platformCommission: 20,
paymentApiKey: '',
};

const createDefaultEssayGradingConfig = () => ({
externalApiEnabled: false,
externalApiUrl: '',
externalApiToken: '',
timeoutMs: 30000,
scoreField: 'score',
feedbackField: 'feedback',
});

const createDefaultQuestionTypeForm = () => ({
code: '',
label: '',
description: '',
isEnabled: true,
gradingConfig: createDefaultEssayGradingConfig(),
});

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

const normalizeQuestionTypes = (data) => {
if (!Array.isArray(data)) return [];

return data.map((item) => ({
...item,
gradingConfig: item.gradingConfig && typeof item.gradingConfig === 'object'
? item.gradingConfig
: {},
}));
};

function CauHinhHeThong() {
const [activeTab, setActiveTab] = useState('general');

const [settings, setSettings] = useState(defaultSettings);
const [categories, setCategories] = useState([]);

const [questionTypes, setQuestionTypes] = useState([]);
const [editingQuestionType, setEditingQuestionType] = useState(null);
const [questionTypeForm, setQuestionTypeForm] = useState(createDefaultQuestionTypeForm());
const [isSavingQuestionType, setIsSavingQuestionType] = useState(false);

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

const loadQuestionTypes = async () => {
const data = await fetchQuestionTypeConfigsApi();
setQuestionTypes(normalizeQuestionTypes(data));
};

const loadData = async () => {
try {
setIsLoading(true);
clearMessage();

      await Promise.all([loadSettings(), loadCategories(), loadQuestionTypes()]);
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
      [name]: value,
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
        !Number.isFinite(payload.platformCommission) ||
        payload.platformCommission < 0 ||
        payload.platformCommission > 100
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

const handleStartEditQuestionType = (questionType) => {
    clearMessage();
    setEditingQuestionType(questionType);

    setQuestionTypeForm({
      code: questionType.code,
      label: questionType.label || '',
      description: questionType.description || '',
      isEnabled: Boolean(questionType.isEnabled),
      gradingConfig: {
        ...createDefaultEssayGradingConfig(),
        ...(questionType.gradingConfig || {}),
        externalApiToken: '',
      },
    });
};

const handleCancelEditQuestionType = () => {
    setEditingQuestionType(null);
    setQuestionTypeForm(createDefaultQuestionTypeForm());
  };

  const updateQuestionTypeForm = (field, value) => {
    setQuestionTypeForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateQuestionTypeGradingConfig = (field, value) => {
    setQuestionTypeForm((previous) => ({
      ...previous,
      gradingConfig: {
        ...previous.gradingConfig,
        [field]: value,
      },
    }));
  };

  const handleSaveQuestionType = async () => {
    if (!editingQuestionType) return;

    try {
      clearMessage();

      if (!questionTypeForm.label.trim()) {
        setErrorMessage('Tên hiển thị loại câu hỏi không được để trống.');
        return;
      }

      if (
        questionTypeForm.code === 'ESSAY' &&
        questionTypeForm.gradingConfig.externalApiEnabled &&
        !String(questionTypeForm.gradingConfig.externalApiUrl || '').trim()
      ) {
        setErrorMessage('Vui lòng nhập URL API chấm tự luận ngoài.');
        return;
      }

      setIsSavingQuestionType(true);

      const payload = {
        label: questionTypeForm.label.trim(),
        description: questionTypeForm.description.trim(),
        isEnabled: Boolean(questionTypeForm.isEnabled),
        gradingConfig:
          questionTypeForm.code === 'ESSAY'
            ? {
                externalApiEnabled: Boolean(questionTypeForm.gradingConfig.externalApiEnabled),
                externalApiUrl: String(questionTypeForm.gradingConfig.externalApiUrl || '').trim(),
                externalApiToken: String(questionTypeForm.gradingConfig.externalApiToken || '').trim(),
                timeoutMs: Number(questionTypeForm.gradingConfig.timeoutMs || 30000),
                scoreField: String(questionTypeForm.gradingConfig.scoreField || 'score').trim(),
                feedbackField: String(questionTypeForm.gradingConfig.feedbackField || 'feedback').trim(),
              }
            : questionTypeForm.gradingConfig || {},
      };

      await updateQuestionTypeConfigApi(questionTypeForm.code, payload);

      setSuccessMessage('Đã lưu cấu hình loại câu hỏi.');
      handleCancelEditQuestionType();
      await loadQuestionTypes();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingQuestionType(false);
    }
};

  const renderGeneralTab = () => (
    <div className="system-config-tab-panel">
      <div className="system-config-form-group">
        <label className="system-config-form-label" htmlFor="maxUploadMb">
          Dung lượng upload tối đa (MB)
        </label>
        <input
          className="system-config-form-control"
          id="maxUploadMb"
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
  );

  const renderCategoriesTab = () => (
    <div className="system-config-tab-panel">
      <p style={{ marginBottom: '16px' }}>Quản lý các chuyên ngành đào tạo trên nền tảng.</p>

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
        <div className="system-config-empty">Chưa có chuyên ngành nào.</div>
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
                <span className="system-config-category-name">{category.name}</span>
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
  );

  const renderQuestionTypesTab = () => (
    <div className="system-config-tab-panel">
      <p style={{ marginBottom: '16px' }}>
        Quản lý các loại câu hỏi của hệ thống. Với câu hỏi tự luận, admin có thể cấu hình API chấm điểm ngoài.
      </p>

      {questionTypes.length === 0 ? (
        <div className="system-config-empty">
          Chưa có cấu hình loại câu hỏi nào. Hãy chạy seed question types ở backend.
        </div>
      ) : (
        <ul className="system-config-category-list">
          {questionTypes.map((item) => (
            <li className="system-config-category-item" key={item.code} style={{ alignItems: 'flex-start' }}>
              <div>
                <strong>{item.label}</strong>
                <span style={{ color: '#64748b', marginLeft: 8 }}>({item.code})</span>

                <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                  {item.description || 'Chưa có mô tả'}
                </p>

                <p style={{ margin: '6px 0 0' }}>
                  Trạng thái:{' '}
                  <strong style={{ color: item.isEnabled ? '#16a34a' : '#dc2626' }}>
                    {item.isEnabled ? 'Đang bật' : 'Đang tắt'}
                  </strong>
                </p>

                {item.code === 'ESSAY' ? (
                  <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                    API ngoài: {item.gradingConfig?.externalApiEnabled ? 'Đã bật' : 'Chưa bật'}
                  </p>
                ) : null}
              </div>

              <div className="system-config-category-actions">
                <button
                  className="system-config-btn system-config-btn-outline system-config-btn-sm"
                  onClick={() => handleStartEditQuestionType(item)}
                  type="button"
                >
                  Sửa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
const renderQuestionTypeModal = () => {
  if (!editingQuestionType) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleCancelEditQuestionType();
        }
      }}
    >
      <div
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              Sửa loại câu hỏi
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              Mã loại: <strong>{questionTypeForm.code}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelEditQuestionType}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="system-config-form-group">
          <label className="system-config-form-label">
            Tên hiển thị
          </label>
          <input
            className="system-config-form-control"
            value={questionTypeForm.label}
            onChange={(event) => updateQuestionTypeForm('label', event.target.value)}
          />
        </div>

        <div className="system-config-form-group">
          <label className="system-config-form-label">
            Mô tả
          </label>
          <textarea
            className="system-config-form-control"
            rows={3}
            value={questionTypeForm.description}
            onChange={(event) => updateQuestionTypeForm('description', event.target.value)}
          />
        </div>

        <div className="system-config-form-group">
          <label>
            <input
              type="checkbox"
              checked={questionTypeForm.isEnabled}
              onChange={(event) => updateQuestionTypeForm('isEnabled', event.target.checked)}
            />{' '}
            Cho phép giáo viên sử dụng loại câu hỏi này
          </label>
        </div>

        {questionTypeForm.code === 'ESSAY' ? (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              border: '1px solid #e8eaed',
              borderRadius: 12,
              background: '#f8fafc',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Cấu hình API chấm tự luận ngoài
            </h3>

            <div className="system-config-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(questionTypeForm.gradingConfig.externalApiEnabled)}
                  onChange={(event) =>
                    updateQuestionTypeGradingConfig('externalApiEnabled', event.target.checked)
                  }
                />{' '}
                Bật chấm tự luận bằng API ngoài
              </label>
            </div>

            <div className="system-config-form-group">
              <label className="system-config-form-label">
                URL API
              </label>
              <input
                className="system-config-form-control"
                placeholder="http://localhost:7001/api/grade-essay"
                value={questionTypeForm.gradingConfig.externalApiUrl || ''}
                onChange={(event) =>
                  updateQuestionTypeGradingConfig('externalApiUrl', event.target.value)
                }
              />
            </div>

            <div className="system-config-form-group">
              <label className="system-config-form-label">
                Token/API key
              </label>
              <input
                className="system-config-form-control"
                placeholder="Để trống nếu không đổi token"
                value={questionTypeForm.gradingConfig.externalApiToken || ''}
                onChange={(event) =>
                  updateQuestionTypeGradingConfig('externalApiToken', event.target.value)
                }
              />
              <small style={{ color: '#64748b' }}>
                Nếu token đã được cấu hình trước đó, để trống ô này sẽ giữ token cũ.
              </small>
            </div>

            <div className="system-config-form-group">
              <label className="system-config-form-label">
                Timeout, ms
              </label>
              <input
                className="system-config-form-control"
                type="number"
                min="1000"
                max="120000"
                value={questionTypeForm.gradingConfig.timeoutMs || 30000}
                onChange={(event) =>
                  updateQuestionTypeGradingConfig('timeoutMs', event.target.value)
                }
              />
            </div>

            <div className="system-config-form-group">
              <label className="system-config-form-label">
                Field điểm trả về
              </label>
              <input
                className="system-config-form-control"
                value={questionTypeForm.gradingConfig.scoreField || 'score'}
                onChange={(event) =>
                  updateQuestionTypeGradingConfig('scoreField', event.target.value)
                }
              />
            </div>

            <div className="system-config-form-group">
              <label className="system-config-form-label">
                Field phản hồi trả về
              </label>
              <input
                className="system-config-form-control"
                value={questionTypeForm.gradingConfig.feedbackField || 'feedback'}
                onChange={(event) =>
                  updateQuestionTypeGradingConfig('feedbackField', event.target.value)
                }
              />
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            className="system-config-btn system-config-btn-outline"
            disabled={isSavingQuestionType}
            onClick={handleCancelEditQuestionType}
            type="button"
          >
            Hủy
          </button>

          <button
            className="system-config-btn system-config-btn-primary"
            disabled={isSavingQuestionType}
            onClick={handleSaveQuestionType}
            type="button"
          >
            {isSavingQuestionType ? 'Đang lưu...' : 'Lưu loại câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
};
  const renderActiveTab = () => {
    if (isLoading) {
      return <div style={{ padding: '24px 0' }}>Đang tải cấu hình hệ thống...</div>;
    }

    if (activeTab === 'general') {
      return renderGeneralTab();
    }

    if (activeTab === 'categories') {
      return renderCategoriesTab();
    }

    return renderQuestionTypesTab();
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

            <button
              className={`system-config-tab-label ${activeTab === 'questionTypes' ? 'active' : ''}`}
              onClick={() => {
                clearMessage();
                setActiveTab('questionTypes');
              }}
              type="button"
            >
              Loại câu hỏi
            </button>
          </div>

          {errorMessage && <div className="system-config-alert system-config-alert-error">{errorMessage}</div>}

          {successMessage && <div className="system-config-alert system-config-alert-success">{successMessage}</div>}

          {renderActiveTab()}
        </div>
      </main>
      {renderQuestionTypeModal()}
    </div>
  );
}

export default CauHinhHeThong;