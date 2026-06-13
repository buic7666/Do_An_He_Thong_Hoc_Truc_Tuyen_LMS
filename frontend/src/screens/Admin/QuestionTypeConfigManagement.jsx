import { useEffect, useState } from 'react';
import {
  fetchQuestionTypeConfigsApi,
  updateQuestionTypeConfigApi,
} from '../../api/adminApi';

const DEFAULT_EDIT_FORM = {
  code: '',
  label: '',
  description: '',
  isEnabled: true,
  gradingConfig: {
    externalApiEnabled: false,
    externalApiUrl: '',
    externalApiToken: '',
    timeoutMs: 30000,
    scoreField: 'score',
    feedbackField: 'feedback',
  },
};

function QuestionTypeConfigManagement() {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(DEFAULT_EDIT_FORM);
  const [isLoading, setIsLoading] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);

    try {
      const data = await fetchQuestionTypeConfigsApi();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      alert(error?.response?.data?.message || 'Không thể tải danh sách loại câu hỏi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const startEdit = (item) => {
    setEditingItem(item);

    setForm({
      code: item.code,
      label: item.label || '',
      description: item.description || '',
      isEnabled: Boolean(item.isEnabled),
      gradingConfig: {
        externalApiEnabled: Boolean(item.gradingConfig?.externalApiEnabled),
        externalApiUrl: item.gradingConfig?.externalApiUrl || '',
        externalApiToken: '',
        timeoutMs: item.gradingConfig?.timeoutMs || 30000,
        scoreField: item.gradingConfig?.scoreField || 'score',
        feedbackField: item.gradingConfig?.feedbackField || 'feedback',
      },
    });
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateGradingConfig = (field, value) => {
    setForm((prev) => ({
      ...prev,
      gradingConfig: {
        ...prev.gradingConfig,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!editingItem) return;

    if (!form.label.trim()) {
      alert('Vui lòng nhập tên hiển thị.');
      return;
    }

    if (
      form.code === 'ESSAY'
      && form.gradingConfig.externalApiEnabled
      && !form.gradingConfig.externalApiUrl.trim()
    ) {
      alert('Vui lòng nhập URL API chấm tự luận ngoài.');
      return;
    }

    try {
      const payload = {
        label: form.label.trim(),
        description: form.description.trim(),
        isEnabled: form.isEnabled,
        gradingConfig: form.code === 'ESSAY'
          ? {
              externalApiEnabled: Boolean(form.gradingConfig.externalApiEnabled),
              externalApiUrl: form.gradingConfig.externalApiUrl.trim(),
              externalApiToken: form.gradingConfig.externalApiToken.trim(),
              timeoutMs: Number(form.gradingConfig.timeoutMs || 30000),
              scoreField: form.gradingConfig.scoreField.trim() || 'score',
              feedbackField: form.gradingConfig.feedbackField.trim() || 'feedback',
            }
          : editingItem.gradingConfig || {},
      };

      await updateQuestionTypeConfigApi(form.code, payload);
      alert('Đã lưu cấu hình loại câu hỏi.');

      setEditingItem(null);
      setForm(DEFAULT_EDIT_FORM);
      await loadItems();
    } catch (error) {
      alert(error?.response?.data?.message || 'Không thể lưu cấu hình.');
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Cấu hình loại câu hỏi</h1>

      {isLoading ? <p>Đang tải dữ liệu...</p> : null}

      <section style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {items.map((item) => (
          <article
            key={item.code}
            style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                {item.label} <small style={{ color: '#64748b' }}>({item.code})</small>
              </h3>

              <p style={{ margin: '6px 0', color: '#64748b' }}>
                {item.description || 'Chưa có mô tả'}
              </p>

              <p style={{ margin: 0 }}>
                Trạng thái:{' '}
                <strong style={{ color: item.isEnabled ? '#16a34a' : '#dc2626' }}>
                  {item.isEnabled ? 'Đang bật' : 'Đang tắt'}
                </strong>
              </p>

              {item.code === 'ESSAY' ? (
                <p style={{ margin: '6px 0 0', color: '#64748b' }}>
                  API ngoài:{' '}
                  {item.gradingConfig?.externalApiEnabled
                    ? 'Đã bật'
                    : 'Chưa bật'}
                </p>
              ) : null}
            </div>

            <button type="button" onClick={() => startEdit(item)}>
              Sửa
            </button>
          </article>
        ))}
      </section>

      {editingItem ? (
        <section
          style={{
            marginTop: 24,
            padding: 20,
            border: '1px solid #dbeafe',
            borderRadius: 12,
            background: '#f8fafc',
          }}
        >
          <h2>Sửa loại câu hỏi: {editingItem.code}</h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              Tên hiển thị
              <input
                value={form.label}
                onChange={(event) => updateForm('label', event.target.value)}
                style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
              />
            </label>

            <label>
              Mô tả
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
                style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
              />
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(event) => updateForm('isEnabled', event.target.checked)}
              />{' '}
              Cho phép giáo viên sử dụng loại câu hỏi này
            </label>

            {form.code === 'ESSAY' ? (
              <div
                style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#fff',
                }}
              >
                <h3>Cấu hình API chấm tự luận ngoài</h3>

                <label>
                  <input
                    type="checkbox"
                    checked={form.gradingConfig.externalApiEnabled}
                    onChange={(event) =>
                      updateGradingConfig('externalApiEnabled', event.target.checked)
                    }
                  />{' '}
                  Bật chấm tự luận bằng API ngoài
                </label>

                <label style={{ display: 'block', marginTop: 12 }}>
                  URL API
                  <input
                    value={form.gradingConfig.externalApiUrl}
                    onChange={(event) =>
                      updateGradingConfig('externalApiUrl', event.target.value)
                    }
                    placeholder="http://localhost:7001/api/grade-essay"
                    style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
                  />
                </label>

                <label style={{ display: 'block', marginTop: 12 }}>
                  Token/API key
                  <input
                    value={form.gradingConfig.externalApiToken}
                    onChange={(event) =>
                      updateGradingConfig('externalApiToken', event.target.value)
                    }
                    placeholder="Để trống nếu không đổi token"
                    style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
                  />
                  <small>
                    Nếu đã cấu hình token trước đó, để trống ô này sẽ giữ token cũ.
                  </small>
                </label>

                <label style={{ display: 'block', marginTop: 12 }}>
                  Timeout, ms
                  <input
                    type="number"
                    value={form.gradingConfig.timeoutMs}
                    onChange={(event) =>
                      updateGradingConfig('timeoutMs', event.target.value)
                    }
                    style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
                  />
                </label>

                <label style={{ display: 'block', marginTop: 12 }}>
                  Field điểm trả về
                  <input
                    value={form.gradingConfig.scoreField}
                    onChange={(event) =>
                      updateGradingConfig('scoreField', event.target.value)
                    }
                    style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
                  />
                </label>

                <label style={{ display: 'block', marginTop: 12 }}>
                  Field phản hồi trả về
                  <input
                    value={form.gradingConfig.feedbackField}
                    onChange={(event) =>
                      updateGradingConfig('feedbackField', event.target.value)
                    }
                    style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}
                  />
                </label>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handleSave}>
                Lưu
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setForm(DEFAULT_EDIT_FORM);
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default QuestionTypeConfigManagement;