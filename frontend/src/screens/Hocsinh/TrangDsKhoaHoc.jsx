import { useEffect, useMemo, useState } from 'react';
import './TrangDsKhoaHoc.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCoursesApi } from '../../api/courseApi';
import { createEnrollmentApi, fetchMyEnrollmentsApi } from '../../api/enrollmentApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import { isAccessTokenValid } from '../../utils/authSession';
import { getCourseImageDataUrl } from '../../utils/courseImage';
import { getCourseDurationLabel } from '../../utils/courseDurationLabel';

const categoryOptions = ['Công nghệ thông tin', 'Kinh tế & Kinh doanh', 'Ngoại ngữ'];
const durationOptions = ['Ngắn', 'Trung bình', 'Dài'];

function inferCourseCategory(course) {
  const title = String(course?.title || '').toLowerCase();

  if (/kinh doanh|marketing|tài chính|ke toan|business|finance/.test(title)) {
    return 'Kinh tế & Kinh doanh';
  }

  if (/anh văn|tiếng anh|ielts|toeic|ngoại ngữ|english|japanese|korean/.test(title)) {
    return 'Ngoại ngữ';
  }

  if (/react|node|javascript|flutter|ai|machine learning|mạng|network|code|lập trình/.test(title)) {
    return 'Công nghệ thông tin';
  }

  const fallbackIndex = (Number(course?.id || 1) - 1) % categoryOptions.length;
  return categoryOptions[fallbackIndex];
}

function formatPrice(price) {
  return `${price.toLocaleString('vi-VN')}đ`;
}

function TrangDsKhoaHoc() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUserSafely();
  const token = sessionStorage.getItem('accessToken');
  const isStudentAuthenticated = currentUser?.role === 'student' && isAccessTokenValid(token);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceType, setPriceType] = useState('Tất cả');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setActionMessage('');

      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          fetchCoursesApi(),
          isStudentAuthenticated ? fetchMyEnrollmentsApi().catch(() => []) : Promise.resolve([]),
        ]);

        const normalizedCourses = (Array.isArray(coursesData) ? coursesData : []).map((item) => {
          const mappedCategory = inferCourseCategory(item);
          const mappedDuration = getCourseDurationLabel(item);

          return {
            id: item.id,
            image: getCourseImageDataUrl(item.title, item.id),
            alt: item.title,
            category: mappedCategory,
            categoryFilter: mappedCategory,
            level: mappedDuration,
            title: item.title,
            rating: `${item.totalStudents || 0} học viên`,
            price: Number(item.price || 0),
          };
        });

        setCourses(normalizedCourses);

        const enrollmentList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
        setEnrolledCourseIds(enrollmentList.map((item) => Number(item.courseId)).filter(Number.isFinite));
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không tải được danh sách khóa học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [isStudentAuthenticated]);

  useEffect(() => {
    const selectedCategory = searchParams.get('category');

    if (selectedCategory && categoryOptions.includes(selectedCategory)) {
      setSelectedCategories([selectedCategory]);
      return;
    }

    if (!selectedCategory) {
      setSelectedCategories([]);
    }
  }, [searchParams]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(course.categoryFilter);

      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level);

      const isFree = course.price === 0;
      const matchesPrice =
        priceType === 'Tất cả' || (priceType === 'Miễn phí' ? isFree : !isFree);

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  }, [courses, priceType, searchText, selectedCategories, selectedLevels]);

  const toggleValue = (value, current, setState) => {
    setState(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const handleEnrollQuickly = async (courseId) => {
    if (!isStudentAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/enroll/${courseId}`)}`);
      return;
    }

    setActionMessage('');
    setEnrollingCourseId(courseId);

    try {
      await createEnrollmentApi(courseId);
      setEnrolledCourseIds((previous) => (previous.includes(Number(courseId)) ? previous : [...previous, Number(courseId)]));
      setActionMessage('Đăng ký khóa học thành công. Bạn có thể vào học ngay.');
    } catch (error) {
      if (error?.response?.status === 409) {
        setEnrolledCourseIds((previous) => (previous.includes(Number(courseId)) ? previous : [...previous, Number(courseId)]));
        setActionMessage('Bạn đã đăng ký khóa học này trước đó.');
      } else {
        setActionMessage(error?.response?.data?.message || 'Đăng ký khóa học thất bại.');
      }
    } finally {
      setEnrollingCourseId(null);
    }
  };

  return (
    <div className='course-list-page'>
      <header className='course-list-header'>
        <div className='course-list-logo'>LMS Platform</div>
        {isStudentAuthenticated ? (
          <Link to='/dashboard' className='course-list-login-link'>
            Dashboard của tôi
          </Link>
        ) : (
          <Link to='/login' className='course-list-login-link'>
            Đăng nhập
          </Link>
        )}
      </header>

      <section className='course-list-search-section'>
        <h1>Khám phá khóa học</h1>
        <div className='course-list-search-container'>
          <input
            type='text'
            className='course-list-search-input'
            placeholder='Tìm kiếm theo tên, công nghệ, giảng viên...'
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <button type='button' className='course-list-search-btn'>
            Tìm kiếm
          </button>
        </div>
      </section>

      <div className='course-list-main-container'>
        <aside className='course-list-sidebar'>
          <div className='course-list-filter-group'>
            <h3 className='course-list-filter-title'>Chuyên mục</h3>
            {categoryOptions.map((option) => (
              <label key={option} className='course-list-filter-label'>
                <input
                  type='checkbox'
                  checked={selectedCategories.includes(option)}
                  onChange={() => toggleValue(option, selectedCategories, setSelectedCategories)}
                />
                {option}
              </label>
            ))}
          </div>

          <div className='course-list-filter-group'>
            <h3 className='course-list-filter-title'>Thời lượng</h3>
            {durationOptions.map((option) => (
              <label key={option} className='course-list-filter-label'>
                <input
                  type='checkbox'
                  checked={selectedLevels.includes(option)}
                  onChange={() => toggleValue(option, selectedLevels, setSelectedLevels)}
                />
                {option}
              </label>
            ))}
          </div>

          <div className='course-list-filter-group'>
            <h3 className='course-list-filter-title'>Giá</h3>
            {['Tất cả', 'Miễn phí', 'Có phí'].map((option) => (
              <label key={option} className='course-list-filter-label'>
                <input
                  type='radio'
                  name='price'
                  checked={priceType === option}
                  onChange={() => setPriceType(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </aside>

        <main className='course-list-content'>
          {isLoading && <p className='course-list-empty'>Đang tải dữ liệu khóa học...</p>}
          {!isLoading && errorMessage && <p className='course-list-empty'>{errorMessage}</p>}
          {!isLoading && !errorMessage && actionMessage && <p className='course-list-action-message'>{actionMessage}</p>}

          {!isLoading && !errorMessage && (
            <div className='course-list-grid'>
              {filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(Number(course.id));

                return (
                  <article key={course.id} className='course-list-card'>
                    <Link to={`/courses/${course.id}`} className='course-list-card-link'>
                      <img src={course.image} alt={course.alt} className='course-list-thumb' />
                      <div className='course-list-info'>
                        <span className='course-list-category'>{course.category}</span>
                        <span className='course-list-duration'>{course.level}</span>
                        <h3 className='course-list-title'>{course.title}</h3>
                        <div className='course-list-meta'>
                          <span className='course-list-rating'>{course.rating}</span>
                          <span className='course-list-price'>{formatPrice(course.price)}</span>
                        </div>
                      </div>
                    </Link>

                    <div className='course-list-actions'>
                      <Link to={`/courses/${course.id}`} className='course-list-action-btn course-list-action-btn-outline'>
                        Xem chi tiết
                      </Link>

                      {isEnrolled ? (
                        <button
                          type='button'
                          className='course-list-action-btn course-list-action-btn-primary'
                          onClick={() => navigate(`/learn?courseId=${course.id}`)}
                        >
                          Vào học
                        </button>
                      ) : (
                        <button
                          type='button'
                          className='course-list-action-btn course-list-action-btn-primary'
                          onClick={() => handleEnrollQuickly(course.id)}
                          disabled={enrollingCourseId === course.id}
                        >
                          {enrollingCourseId === course.id ? 'Đang đăng ký...' : 'Đăng ký nhanh'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !errorMessage && filteredCourses.length === 0 && (
            <p className='course-list-empty'>Không tìm thấy khóa học phù hợp với bộ lọc hiện tại.</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default TrangDsKhoaHoc;
