import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchCoursesApi } from '../../api/courseApi';

import './GiangVienPublic.css';

function getInitials(name) {
  return String(name || 'GV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('');
}

function DanhSachGiangVien() {
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
        setErrorMessage(error?.response?.data?.message || 'Không thể tải danh sách giảng viên.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const instructors = useMemo(() => {
    const map = new Map();

    courses.forEach((course) => {
      const instructor = course.instructor;

      if (!instructor?.id) {
        return;
      }

      const existed = map.get(instructor.id);

      if (existed) {
        existed.totalCourses += 1;
        existed.totalStudents += Number(course.totalStudents || 0);
        return;
      }

      map.set(instructor.id, {
        id: instructor.id,
        name: instructor.name || 'Giảng viên',
        email: instructor.email || 'Đang cập nhật',
        totalCourses: 1,
        totalStudents: Number(course.totalStudents || 0),
      });
    });

    return Array.from(map.values());
  }, [courses]);

  return (
    <div className='instructors-page'>
      <h1>Danh sách giảng viên</h1>
      <p className='instructors-subtitle'>Khám phá hồ sơ và các khóa học nổi bật của từng giảng viên.</p>

      {isLoading && <p>Đang tải dữ liệu giảng viên...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}

      {!isLoading && !errorMessage && (
        <div className='instructors-grid'>
          {instructors.map((instructor) => (
            <Link key={instructor.id} to={`/instructors/${instructor.id}`} className='instructor-card'>
              <div className='instructor-avatar'>{getInitials(instructor.name)}</div>
              <h3 className='instructor-name'>{instructor.name}</h3>
              <p className='instructor-email'>{instructor.email}</p>
              <p className='instructor-meta'>
                {instructor.totalCourses} khóa học • {instructor.totalStudents} học viên
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DanhSachGiangVien;
