import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../utils/authSession';
import './AdminSidebar.css';

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Bảng điều khiển' },
  { path: '/admin/users', label: 'Quản lý người dùng' },
  { path: '/admin/course-approval', label: 'Phê duyệt khóa học' },
  { path: '/admin/settings', label: 'Cấu hình hệ thống' },
  { path: '/admin/transactions', label: 'Quản lý giao dịch' },
  { path: '/admin/support', label: 'Quản lý phản hồi' },
];

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className='admin-shared-sidebar'>
      <div className='admin-shared-brand'>
        <div className='admin-shared-brand-icon'>A</div>
        <span>Admin Control</span>
      </div>

      <ul className='admin-shared-nav'>
        {adminNavItems.map((item) => (
          <li key={item.path}>
            <button
              type='button'
              className={`admin-shared-nav-button ${isActive(item.path) ? 'is-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <button type='button' className='admin-shared-logout' onClick={() => logout({ navigate })}>
        Đăng xuất
      </button>
    </aside>
  );
}

export default AdminSidebar;
