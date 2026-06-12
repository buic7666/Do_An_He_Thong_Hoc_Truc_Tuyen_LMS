/**
 * Example: Integrating Quiz Components into Course Detail Page
 * This shows how to add quiz functionality to your existing course page
 * 
 * File: frontend/src/screens/Hocsinh/ManHinhChiTietKhoa.jsx (example)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuizList from '../../components/QuizList';
import QuizTaker from '../../components/QuizTaker';
import './ManHinhChiTietKhoa.css';

/**
 * Course Detail Page with Quiz Support
 * Shows lessons and quizzes for a course
 */
const CourseDetailPage = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'quizzes'
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== LOAD COURSE DATA =====
  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  // ===== QUIZ HANDLERS =====
  const handleQuizSelect = (quizId) => {
    setSelectedQuizId(quizId);
    // Optional: scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizBack = () => {
    setSelectedQuizId(null);
  };

  const handleQuizSubmit = (result) => {
    console.log('Quiz submitted:', result);
    // Optional: Show success message
    alert(`✅ Bạn đã nộp bài! Điểm: ${result.totalScore?.toFixed(1)}%`);
    // Optional: Refresh course data or stay on page
    setSelectedQuizId(null);
  };

  if (loading) {
    return (
      <div className="course-detail course-detail--loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin khóa học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-detail course-detail--error">
        <h3>❌ Lỗi</h3>
        <p>{error}</p>
        <button onClick={loadCourseData}>Thử lại</button>
      </div>
    );
  }

  if (!course) {
    return <div>No course found</div>;
  }

  return (
    <div className="course-detail">
      {/* Course Header */}
      <div className="course-header">
        <div className="course-header__content">
          <h1 className="course-title">{course.title}</h1>
          <p className="course-instructor">
            👨‍🏫 Giáo viên: {course.instructor?.name}
          </p>
          <div className="course-meta">
            <span className="meta-item">📚 {course.lessons?.length || 0} bài học</span>
            <span className="meta-item">💰 {course.price?.toLocaleString()}đ</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="course-tabs-container">
        <div className="course-tabs">
          <button
            className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-label">Bài Học</span>
          </button>

          <button
            className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-label">Bài Kiểm Tra</span>
          </button>

          <button className="tab-button" onClick={() => setActiveTab('discuss')}>
            <span className="tab-icon">💬</span>
            <span className="tab-label">Thảo Luận</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="course-content">
        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="tab-panel lessons-panel">
            {course.lessons && course.lessons.length > 0 ? (
              <div className="lessons-list">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="lesson-item">
                    <div className="lesson-number">{index + 1}</div>
                    <div className="lesson-content">
                      <h3 className="lesson-title">{lesson.title}</h3>
                      <p className="lesson-duration">
                        ⏱️ Khoảng {lesson.duration || 'N/A'} phút
                      </p>
                    </div>
                    <button className="btn btn-primary">Xem bài</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Khóa học này chưa có bài học nào</p>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="tab-panel quizzes-panel">
            {selectedQuizId ? (
              // Quiz Taker View
              <div className="quiz-taker-container">
                <button
                  className="btn-back"
                  onClick={handleQuizBack}
                >
                  ← Quay lại danh sách
                </button>
                <QuizTaker
                  quizId={selectedQuizId}
                  onBack={handleQuizBack}
                  onSubmit={handleQuizSubmit}
                />
              </div>
            ) : (
              // Quiz List View
              <QuizList
                courseId={courseId}
                onSelectQuiz={handleQuizSelect}
              />
            )}
          </div>
        )}

        {/* Discussion Tab (Placeholder) */}
        {activeTab === 'discuss' && (
          <div className="tab-panel discuss-panel">
            <div className="empty-state">
              <p>Chức năng thảo luận đang phát triển</p>
            </div>
          </div>
        )}
      </div>

      {/* Course Description */}
      <div className="course-description">
        <h2>Mô Tả Khóa Học</h2>
        <p>{course.description}</p>
      </div>
    </div>
  );
};

export default CourseDetailPage;

/**
 * ===== INTEGRATION GUIDE =====
 * 
 * 1. Copy the CourseDetailPage component above to your course detail page
 * 
 * 2. Add CSS styles to your ManHinhChiTietKhoa.css file:
 *    See QUIZ_INTEGRATION_STYLES.css for complete styles
 * 
 * 3. Usage in your app routing:
 *    import CourseDetailPage from './screens/Hocsinh/ManHinhChiTietKhoa';
 *    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
 * 
 * 4. In your course list:
 *    <Link to={`/courses/${course.id}`}>{course.title}</Link>
 * 
 * Features included:
 * - Quiz list display with QuizList component
 * - Quiz taker with QuizTaker component
 * - Tab navigation (Lessons, Quizzes, Discussion)
 * - Responsive design
 * - Error handling
 */
