import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import './QuanLyNguoiDung.css';
import { logout } from '../../utils/authSession';

const usersSeed = [
  {
    id: 1,
    fullName: 'Bui Van Dong',
    email: 'dong.buivan@instructor.com',
    role: 'Giảng viên',
    roleType: 'instructor',
    joinedAt: '15/01/2026',
    status: 'Hoạt động',
    statusType: 'active',
    avatar: 'D',
    avatarStyle: 'primary',
  },
  {
    id: 2,
    fullName: 'Le Quang Minh',
    email: 'minh.lq@student.edu.vn',
    role: 'Học viên',
    roleType: 'student',
    joinedAt: '20/02/2026',
    status: 'Hoạt động',
    statusType: 'active',
    avatar: 'M',
    avatarStyle: 'default',
  },
  {
    id: 3,
    fullName: 'Nguyen Van Hung',
    email: 'hung.nv@spam.com',
    role: 'Học viên',
    roleType: 'student',
    joinedAt: '10/03/2026',
    status: 'Bị khóa',
    statusType: 'locked',
    avatar: 'H',
    avatarStyle: 'danger',
  },
];

function QuanLyNguoiDung() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roleFilter, setRoleFilter] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const validRole = roleParam === 'instructor' || roleParam === 'student' ? roleParam : '';
    setRoleFilter(validRole);
  }, [searchParams]);

  const handleLogout = () => {
    logout({ navigate });
  };

  const goTo = (path) => () => navigate(path);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return usersSeed.filter((user) => {
      const roleMatch = roleFilter ? user.roleType === roleFilter : true;
      const searchMatch = normalizedQuery
        ? `${user.fullName} ${user.email}`.toLowerCase().includes(normalizedQuery)
        : true;

      return roleMatch && searchMatch;
    });
  }, [query, roleFilter]);

  const handleAddUser = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert('Mở form thêm tài khoản mới (demo).');
  };

  const handleEditRole = (user) => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`Chỉnh sửa quyền cho: ${user.fullName}`);
  };

  const handleToggleLock = (user) => {
    const action = user.statusType === 'locked' ? 'Mở khóa' : 'Khóa';
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert(`${action} tài khoản: ${user.fullName}`);
  };

  return (
    <div className="admin-users-page">
      <aside className="admin-users-sidebar">
        <div className="admin-users-brand">
          <div className="admin-users-brand-icon">A</div>
          <span>Admin Control</span>
        </div>

        <ul className="admin-users-nav-menu">
          <li>
            <button className="admin-users-nav-link" type="button" onClick={goTo('/admin/dashboard')}>
              Bảng điều khiển
            </button>
          </li>
          <li>
            <button className="admin-users-nav-link active" type="button">
              Quản lý người dùng
            </button>
          </li>
          <li>
            <button className="admin-users-nav-link" type="button" onClick={goTo('/admin/course-approval')}>
              Phê duyệt khóa học
            </button>
          </li>
          <li>
            <button className="admin-users-nav-link" type="button" onClick={goTo('/admin/settings')}>
              Cấu hình hệ thống
            </button>
          </li>
        </ul>

        <button className="admin-users-logout-btn" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-users-main-content">
        <h1 className="admin-users-page-title">Quản lý tài khoản người dùng</h1>

        <section className="admin-users-toolbar">
          <div className="admin-users-filter-actions">
            <select className="admin-users-form-select" onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
              <option value="">Tất cả vai trò</option>
              <option value="instructor">Giảng viên</option>
              <option value="student">Học viên</option>
            </select>

            <input
              className="admin-users-form-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo Email, SĐT hoặc tên..."
              type="text"
              value={query}
            />
          </div>

          <button className="admin-users-btn admin-users-btn-primary" onClick={handleAddUser} type="button">
            + Thêm tài khoản mới
          </button>
        </section>

        <section className="admin-users-table-card">
          <table className="admin-users-data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-users-user-info">
                      <div className={`admin-users-user-avatar ${user.avatarStyle}`}>{user.avatar}</div>
                      <div>
                        <span className="admin-users-user-name">{user.fullName}</span>
                        <span className="admin-users-user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`admin-users-badge admin-users-role-${user.roleType}`}>{user.role}</span>
                  </td>

                  <td>{user.joinedAt}</td>

                  <td>
                    <span className={`admin-users-badge admin-users-status-${user.statusType}`}>{user.status}</span>
                  </td>

                  <td>
                    <div className="admin-users-action-btns">
                      <button
                        className="admin-users-btn-icon admin-users-btn-edit"
                        onClick={() => handleEditRole(user)}
                        title="Sửa quyền"
                        type="button"
                      >
                        K
                      </button>
                      <button
                        className={`admin-users-btn-icon admin-users-btn-lock ${user.statusType === 'locked' ? 'is-locked' : ''}`}
                        onClick={() => handleToggleLock(user)}
                        title={user.statusType === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
                        type="button"
                      >
                        {user.statusType === 'locked' ? 'U' : 'L'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default QuanLyNguoiDung;
