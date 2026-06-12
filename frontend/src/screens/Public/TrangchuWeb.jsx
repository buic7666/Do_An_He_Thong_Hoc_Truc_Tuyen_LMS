import './TrangchuWeb.css';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCoursesApi } from '../../api/courseApi';
import { getCourseImageDataUrl } from '../../utils/courseImage';
import { getCourseDurationLabel } from '../../utils/courseDurationLabel';

const categories = [
  {
    id: 1,
    icon: '💻',
    title: 'Công nghệ thông tin',
    count: '250+ Khóa học',
  },
  {
    id: 2,
    icon: '📊',
    title: 'Kinh tế & Kinh doanh',
    count: '120+ Khóa học',
  },
  {
    id: 3,
    icon: '🌐',
    title: 'Ngoại ngữ',
    count: '85+ Khóa học',
  },
];

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

function TrangchuWeb() {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesError('');

      try {
        const data = await fetchCoursesApi();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        setCoursesError(error?.response?.data?.message || 'Không thể tải danh sách khóa học.');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const featuredCourses = useMemo(() => courses.slice(0, 4), [courses]);

  return (
    <div className='home-page'>
      <header className='home-header'>
        <div className='home-logo'>LMS Platform</div>

        <nav className='home-nav'>
          <ul>
            <li>
              <Link to='/'>Trang chủ</Link>
            </li>
            <li>
              <Link to='/courses'>Khóa học</Link>
            </li>
            <li>
              <Link to='/instructors'>Giảng viên</Link>
            </li>
            <li>
              <Link to='/contact'>Liên hệ</Link>
            </li>
          </ul>
        </nav>

        <div className='home-auth-buttons'>
          <Link to='/login' className='home-btn home-btn-outline'>
            Đăng nhập
          </Link>
          <Link to='/register' className='home-btn home-btn-primary'>
            Đăng ký
          </Link>
        </div>
      </header>

      <section className='home-hero'>
        <div className='home-hero-content'>
          <h1 className='home-hero-title'>
            Hành trình <span>chinh phục tri thức</span>
          </h1>

          <p className='home-hero-desc'>
            Nền tảng học tập trực tuyến hàng đầu cung cấp các khóa học chất lượng cao, giúp bạn nâng
            cấp kỹ năng và thăng tiến trong sự nghiệp.
          </p>

          <Link to='/courses' className='home-btn home-btn-primary home-btn-hero'>
            Khám phá ngay
          </Link>
        </div>
      </section>

      <section className='home-categories'>
        <h2 className='home-section-title'>Danh mục chuyên ngành</h2>
        <div className='home-category-grid'>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/courses?category=${encodeURIComponent(category.title)}`}
              className='home-category-card'
            >
              <div className='home-cat-icon'>{category.icon}</div>
              <h3>{category.title}</h3>
              <p className='home-category-count'>{category.count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className='home-courses'>
        <h2 className='home-section-title home-section-center'>Khóa học nổi bật</h2>
        {isLoadingCourses && <p>Đang tải khóa học...</p>}
        {!isLoadingCourses && coursesError && <p>{coursesError}</p>}
        {!isLoadingCourses && !coursesError && (
          <div className='home-course-grid'>
            {featuredCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className='home-course-card'>
                <img
                  src={getCourseImageDataUrl(course.title, course.id)}
                  alt={course.title}
                  className='home-course-thumb'
                />
                <div className='home-course-info'>
                  <span className='home-course-duration'>{getCourseDurationLabel(course)}</span>
                  <h3 className='home-course-title'>{course.title}</h3>
                  <p className='home-course-instructor'>Giảng viên: {course.instructor?.name || 'Đang cập nhật'}</p>
                  <div className='home-course-meta'>
                    <span className='home-course-rating'>{course.lessonsCount || 0} bài học</span>
                    <span className='home-course-price'>{formatPrice(course.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className='home-footer'>
        <div className='home-footer-content'>
          <div className='home-footer-col'>
            <h3 className='home-footer-brand'>LMS Platform</h3>
            <p>Nền tảng giáo dục trực tuyến hàng đầu, mang tri thức đến mọi nơi, mọi lúc.</p>
            <div className='home-social-links'>
              <a href='#' className='home-social-icon'>
                FB
              </a>
              <a href='#' className='home-social-icon'>
                YT
              </a>
              <a href='#' className='home-social-icon'>
                IN
              </a>
            </div>
          </div>

          <div className='home-footer-col'>
            <h3>Liên kết nhanh</h3>
            <a href='#'>Về chúng tôi</a>
            <a href='#'>Điều khoản sử dụng</a>
            <a href='#'>Chính sách bảo mật</a>
            <a href='#'>Trở thành giảng viên</a>
          </div>

          <div className='home-footer-col'>
            <h3>Thông tin liên hệ</h3>
            <p>📍 123 Đường Học Tập, TP. Hà Nội</p>
            <p>📞 1900 1234</p>
            <p>✉️ support@lmsplatform.edu.vn</p>
          </div>
        </div>

        <div className='home-footer-bottom'>© 2026 LMS Platform. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default TrangchuWeb;
