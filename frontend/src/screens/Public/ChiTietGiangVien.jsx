import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fetchCoursesApi } from '../../api/courseApi';
import { getCourseImageDataUrl } from '../../utils/courseImage';

import './GiangVienPublic.css';

function getInitials(name) {
  return String(name || 'GV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('');
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('vi-VN')}đ`;
}

function ChiTietGiangVien() {
  const { id } = useParams();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchCoursesApi();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Không thể tải thông tin giảng viên.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const instructorCourses = useMemo(() => {
    return courses.filter((course) => String(course?.instructor?.id) === String(id));
  }, [courses, id]);

  const instructor = useMemo(() => {
    return instructorCourses[0]?.instructor || null;
  }, [instructorCourses]);

  return (
    <div className='instructors-page'>
      <p>
        <Link to='/instructors'>← Quay lại danh sách giảng viên</Link>
      </p>

      {isLoading && <p>Đang tải chi tiết giảng viên...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}

      {!isLoading && !errorMessage && !instructor && <p>Không tìm thấy giảng viên.</p>}

      {!isLoading && !errorMessage && instructor && (
        <>
          <div className='instructor-detail-header'>
            <div className='instructor-detail-avatar'>{getInitials(instructor.name)}</div>
            <div>
              <h1 className='instructor-detail-name'>{instructor.name}</h1>
              <p className='instructor-detail-email'>{instructor.email}</p>
            </div>
          </div>

          <h2>Các khóa học đang giảng dạy</h2>
          <p className='instructors-subtitle'>Tổng cộng {instructorCourses.length} khóa học.</p>

          <div className='instructor-course-grid'>
            {instructorCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className='instructor-course-card'>
                <img
                  src={getCourseImageDataUrl(course.title, course.id)}
                  alt={course.title}
                  className='instructor-course-thumb'
                />
                <div className='instructor-course-body'>
                  <h3 className='instructor-course-title'>{course.title}</h3>
                  <p className='instructor-course-meta'>
                    {course.lessonsCount || 0} bài học • {course.totalStudents || 0} học viên • {formatPrice(course.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ChiTietGiangVien;
