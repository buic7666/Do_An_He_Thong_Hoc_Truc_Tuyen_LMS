import { useState } from 'react';

import './CauHinhHeThong.css';
import AdminSidebar from '../../components/AdminSidebar';

const initialGeneralSettings = {
  maxUploadMb: 500,
  platformCommission: 20,
  paymentApiKey: 'VNPAY_SECRET_KEY_889241X',
};

const initialCategories = [
  { id: 1, name: 'Công nghệ thông tin (Software Engineering)' },
  { id: 2, name: 'Kinh tế & Quản trị kinh doanh' },
  { id: 3, name: 'Ngoại ngữ (Tiếng Anh, Tiếng Nhật)' },
];

function CauHinhHeThong() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(initialGeneralSettings);
  const [categories] = useState(initialCategories);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSettings((previous) => ({
      ...previous,
      [name]: name === 'paymentApiKey' ? value : Number(value),
    }));
  };

  const handleSaveSettings = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert('Đã lưu cấu hình hệ thống (demo).');
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
              onClick={() => setActiveTab('general')}
              type="button"
            >
              Cài đặt chung
            </button>
            <button
              className={`system-config-tab-label ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
              type="button"
            >
              Danh mục chuyên ngành
            </button>
          </div>

          {activeTab === 'general' ? (
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
                  type="text"
                  value={settings.paymentApiKey}
                />
              </div>

              <button className="system-config-btn system-config-btn-primary" onClick={handleSaveSettings} type="button">
                Lưu cấu hình hệ thống
              </button>
            </div>
          ) : (
            <div className="system-config-tab-panel">
              <div className="system-config-category-header">
                <p className="system-config-category-note">Quản lý các chuyên ngành đào tạo trên nền tảng.</p>
                <button className="system-config-btn system-config-btn-success" type="button">
                  + Thêm chuyên ngành mới
                </button>
              </div>

              <ul className="system-config-category-list">
                {categories.map((category) => (
                  <li className="system-config-category-item" key={category.id}>
                    <span className="system-config-category-name">{category.name}</span>
                    <div className="system-config-category-actions">
                      <button className="system-config-btn system-config-btn-outline system-config-btn-sm" type="button">
                        Sua
                      </button>
                      <button className="system-config-btn system-config-btn-outline system-config-btn-sm system-config-btn-danger" type="button">
                        Xoa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CauHinhHeThong;
