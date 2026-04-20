import './BangDieuKhienCaNhan.css';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../utils/authSession';

const stats = [
  {
    id: 1,
    icon: '📖',
    value: 3,
    label: 'Khóa học đang học',
    iconClass: 'student-dashboard-stat-icon is-primary',
  },
  {
    id: 2,
    icon: '✅',
    value: 5,
    label: 'Khóa học hoàn thành',
    iconClass: 'student-dashboard-stat-icon is-success',
  },
  {
    id: 3,
    icon: '🏆',
    value: 2,
    label: 'Chứng chỉ đạt được',
    iconClass: 'student-dashboard-stat-icon is-warning',
  },
];

const courses = [
  {
    id: 1,
    title: 'Xây dựng ứng dụng quản lý nhà trọ HousePal với Flutter',
    image: 'https://via.placeholder.com/400x250/1A73E8/FFFFFF?text=Flutter+HousePal',
    progress: 45,
    alt: 'Flutter',
  },
  {
    id: 2,
    title: 'Trí tuệ nhân tạo: Nhập môn Reinforcement Learning',
    image: 'https://via.placeholder.com/400x250/34A853/FFFFFF?text=Reinforcement+Learning',
    progress: 80,
    alt: 'Reinforcement Learning',
  },
  {
    id: 3,
    title: 'JavaScript chuyên sâu cho hệ thống Backend',
    image: 'https://via.placeholder.com/400x250/f9ab00/FFFFFF?text=JavaScript+Backend',
    progress: 15,
    alt: 'JavaScript Backend',
  },
];

function BangDieuKhienCaNhan() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout({ navigate });
  };

  return (
    <div className='student-dashboard'>
      <aside className='student-dashboard-sidebar'>
        <div className='student-dashboard-brand'>LMS Platform</div>

        <ul className='student-dashboard-nav'>
          <li>
            <button type='button' className='student-dashboard-nav-link is-active'>
              📚 Khóa học của tôi
            </button>
          </li>
          <li>
            <button type='button' className='student-dashboard-nav-link'>
              👤 Hồ sơ cá nhân
            </button>
          </li>
          <li>
            <button type='button' className='student-dashboard-nav-link'>
              💳 Lịch sử giao dịch
            </button>
          </li>
        </ul>

        <button type='button' className='student-dashboard-logout' onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      <main className='student-dashboard-main'>
        <header className='student-dashboard-header'>
          <div>
            <h1>Chào mừng trở lại, Đồng!</h1>
            <p>Tiếp tục hành trình học tập của bạn ngay hôm nay.</p>
          </div>

          <div className='student-dashboard-user'>
            <div className='student-dashboard-avatar'>Đ</div>
          </div>
        </header>

        <section className='student-dashboard-stats'>
          {stats.map((item) => (
            <article key={item.id} className='student-dashboard-stat-card'>
              <div className={item.iconClass}>{item.icon}</div>
              <div>
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section>
          <h2 className='student-dashboard-section-title'>Khóa học đang diễn ra</h2>

          <div className='student-dashboard-courses'>
            {courses.map((course) => (
              <article key={course.id} className='student-dashboard-course-card'>
                <img src={course.image} alt={course.alt} className='student-dashboard-course-thumb' />

                <div className='student-dashboard-course-body'>
                  <h3 className='student-dashboard-course-title'>{course.title}</h3>

                  <div className='student-dashboard-progress-wrap'>
                    <div className='student-dashboard-progress-text'>
                      <span>Tiến độ học tập</span>
                      <span className='student-dashboard-progress-value'>{course.progress}%</span>
                    </div>

                    <div className='student-dashboard-progress-bg'>
                      <div className='student-dashboard-progress-fill' style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>

                  <button type='button' className='student-dashboard-continue'>
                    ▶ Tiếp tục học
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default BangDieuKhienCaNhan;
