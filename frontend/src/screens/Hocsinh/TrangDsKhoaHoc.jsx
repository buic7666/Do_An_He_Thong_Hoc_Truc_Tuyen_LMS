import { useEffect, useMemo, useState } from 'react';
import './TrangDsKhoaHoc.css';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCoursesApi } from '../../api/courseApi';
import { getCourseImageDataUrl } from '../../utils/courseImage';

const categoryOptions = ['Công nghệ thông tin', 'Kinh tế & Kinh doanh', 'Ngoại ngữ'];
const levelOptions = ['Cơ bản', 'Trung bình', 'Nâng cao'];

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
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceType, setPriceType] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchCoursesApi();

        const normalizedCourses = (Array.isArray(data) ? data : []).map((item) => {
          const mappedCategory = inferCourseCategory(item);
          const mappedLevel = item.lessonsCount > 8 ? 'Nâng cao' : item.lessonsCount > 4 ? 'Trung bình' : 'Cơ bản';

          return {
            id: item.id,
            image: getCourseImageDataUrl(item.title, item.id),
            alt: item.title,
            category: mappedCategory,
            categoryFilter: mappedCategory,
            level: mappedLevel,
            title: item.title,
            rating: `${item.totalStudents || 0} học viên`,
            price: Number(item.price || 0),
          };
        });

        setCourses(normalizedCourses);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không tải được danh sách khóa học.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

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

  return (
    <div className='course-list-page'>
      <header className='course-list-header'>
        <div className='course-list-logo'>LMS Platform</div>
        <Link to='/login' className='course-list-login-link'>
          Đăng nhập
        </Link>
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
            <h3 className='course-list-filter-title'>Mức độ</h3>
            {levelOptions.map((option) => (
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

          {!isLoading && !errorMessage && (
            <div className='course-list-grid'>
              {filteredCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className='course-list-card'>
                  <img src={course.image} alt={course.alt} className='course-list-thumb' />
                  <div className='course-list-info'>
                    <span className='course-list-category'>{course.category}</span>
                    <h3 className='course-list-title'>{course.title}</h3>
                    <div className='course-list-meta'>
                      <span className='course-list-rating'>{course.rating}</span>
                      <span className='course-list-price'>{formatPrice(course.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
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
