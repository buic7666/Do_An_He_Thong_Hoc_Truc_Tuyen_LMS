import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import './QuanLyNguoiDung.css';
import AdminSidebar from '../../components/AdminSidebar';
import { fetchAdminUsersApi, updateUserRoleApi, updateUserStatusApi, deleteUserApi } from '../../api/adminApi';

const roleMap = {
  admin: 'Quản trị viên',
  teacher: 'Giảng viên',
  student: 'Học viên'
};

const statusMap = {
  active: 'Hoạt động',
  locked: 'Bị khóa'
};

function QuanLyNguoiDung() {
  const [searchParams] = useSearchParams();
  const [roleFilter, setRoleFilter] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const data = await fetchAdminUsersApi();
        if (isMounted) {
          setUsers(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    let validRole = '';
    if (roleParam === 'instructor' || roleParam === 'teacher') validRole = 'teacher';
    else if (roleParam === 'student') validRole = 'student';
    else if (roleParam === 'admin') validRole = 'admin';
    setRoleFilter(validRole);
  }, [searchParams]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const roleMatch = roleFilter ? user.role === roleFilter : true;
      const searchMatch = normalizedQuery
        ? `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery)
        : true;

      return roleMatch && searchMatch;
    });
  }, [query, roleFilter, users]);

  const handleAddUser = () => {
    alert('Mở form thêm tài khoản mới (demo).');
  };

  const handleEditRole = async (user) => {
    const newRole = window.prompt(`Nhập quyền mới cho ${user.name} (admin, teacher, student):`, user.role);
    if (newRole && ['admin', 'teacher', 'student'].includes(newRole) && newRole !== user.role) {
      try {
        await updateUserRoleApi(user.id, newRole);
        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        alert('Cập nhật quyền thành công');
      } catch (err) {
        console.error(err);
        alert('Cập nhật quyền thất bại');
      }
    }
  };

  const handleToggleLock = async (user) => {
    const action = user.status === 'locked' ? 'Mở khóa' : 'Khóa';
    if (window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.name}?`)) {
      try {
        const newStatus = user.status === 'locked' ? 'active' : 'locked';
        await updateUserStatusApi(user.id, newStatus);
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        alert(`${action} thành công`);
      } catch (err) {
        console.error(err);
        alert(`${action} thất bại`);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa VĨNH VIỄN tài khoản ${user.name}? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteUserApi(user.id);
        setUsers(users.filter(u => u.id !== user.id));
        alert('Xóa tài khoản thành công');
      } catch (err) {
        console.error(err);
        alert('Xóa tài khoản thất bại');
      }
    }
  };

  return (
    <div className="admin-users-page">
      <AdminSidebar />

      <main className="admin-users-main-content">
        <h1 className="admin-users-page-title">Quản lý tài khoản người dùng</h1>

        <section className="admin-users-toolbar">
          <div className="admin-users-filter-actions">
            <select className="admin-users-form-select" onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="teacher">Giảng viên</option>
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
          {isLoading ? (
             <p style={{ padding: '20px' }}>Đang tải dữ liệu...</p>
          ) : (
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
                {filteredUsers.map((user) => {
                  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : '?';
                  const avatarStyle = user.role === 'teacher' ? 'primary' : user.role === 'admin' ? 'danger' : 'default';
                  const roleCssClass = user.role === 'teacher' ? 'instructor' : user.role;
                  
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-users-user-info">
                          <div className={`admin-users-user-avatar ${avatarStyle}`}>{avatarLetter}</div>
                          <div>
                            <span className="admin-users-user-name">{user.name}</span>
                            <span className="admin-users-user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`admin-users-badge admin-users-role-${roleCssClass}`}>{roleMap[user.role]}</span>
                      </td>

                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>

                      <td>
                        <span className={`admin-users-badge admin-users-status-${user.status}`}> {statusMap[user.status] || 'Không rõ'}</span>
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
                            className={`admin-users-btn-icon admin-users-btn-lock ${user.status === 'locked' ? 'is-locked' : ''}`}
                            onClick={() => handleToggleLock(user)}
                            title={user.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
                            type="button"
                          >
                            {user.status === 'locked' ? 'U' : 'L'}
                          </button>
                          <button
                            className="admin-users-btn-icon admin-users-btn-delete"
                            onClick={() => handleDeleteUser(user)}
                            title="Xóa tài khoản"
                            type="button"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '4px', border: '1px solid #fca5a5' }}
                          >
                            X
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default QuanLyNguoiDung;