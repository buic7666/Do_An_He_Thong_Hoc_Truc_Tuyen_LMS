import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './ManHinhQuanLyKhoaHoc.css';
import { fetchCoursesApi } from '../../api/courseApi';
import { uploadTeacherFileApi } from '../../api/teacherApi';
import { getCurrentUserSafely } from '../../utils/authRedirect';
import { logout } from '../../utils/authSession';

const initialSections = [
  {
    id: 's1',
    title: 'Chương 1: Khởi tạo dự án & Setup môi trường',
    lessons: [
      {
        id: 'l1',
        title: 'Bài 1: Cài đặt Flutter SDK và Android Studio',
        expanded: false,
        videoUrl: '',
        videoName: '',
        pdfUrl: '',
        pdfName: '',
      },
      {
        id: 'l2',
        title: 'Bài 2: Cấu trúc thư mục chuẩn cho dự án',
        expanded: true,
        videoUrl: '',
        videoName: '',
        pdfUrl: '',
        pdfName: '',
      },
    ],
  },
  {
    id: 's2',
    title: 'Chương 2: Xây dựng UI/UX cho module Đăng nhập',
    lessons: [],
  },
];

function ManHinhQuanLyKhoaHoc() {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout({ navigate });
  };
  const [courseName, setCourseName] = useState('Xây dựng ứng dụng HousePal với Flutter');
  const [shortDescription, setShortDescription] = useState('Hướng dẫn toàn diện cách phát triển ứng dụng di động quản lý phòng trọ...');
  const [price, setPrice] = useState('599000');
  const [specialization, setSpecialization] = useState('Software Engineering');
  const [sections, setSections] = useState(initialSections);
  const [myCourses, setMyCourses] = useState([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageName, setCoverImageName] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonSectionId, setEditingLessonSectionId] = useState(null);
  const [editingLessonText, setEditingLessonText] = useState('');
  const coverInputRef = useRef(null);
  const editInputRef = useRef(null);
  const editLessonInputRef = useRef(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCoursesApi();
        const currentUser = getCurrentUserSafely();
        const teacherCourses = (Array.isArray(data) ? data : []).filter((course) => Number(course?.instructor?.id) === Number(currentUser?.id));

        setMyCourses(teacherCourses);

        if (teacherCourses.length > 0) {
          setCourseName(teacherCourses[0].title || '');
          setShortDescription(teacherCourses[0].description || '');
          setPrice(String(Number(teacherCourses[0].price || 0)));
        }
      } catch (_error) {
        setMyCourses([]);
      }
    };

    loadCourses();
  }, []);

  const totalStudents = useMemo(
    () => myCourses.reduce((sum, course) => sum + Number(course.totalStudents || 0), 0),
    [myCourses],
  );

  const toggleLessonExpanded = (sectionId, lessonId) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          lessons: section.lessons.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, expanded: !lesson.expanded } : lesson,
          ),
        };
      }),
    );
  };

  const addLesson = (sectionId) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) return section;
        const nextIndex = section.lessons.length + 1;
        return {
          ...section,
          lessons: [
            ...section.lessons,
            {
              id: `${sectionId}-l${nextIndex}`,
              title: `Bai ${nextIndex}: Bai giang moi`,
              expanded: false,
              videoUrl: '',
              videoName: '',
              pdfUrl: '',
              pdfName: '',
            },
          ],
        };
      }),
    );
  };

  const addSection = () => {
    setSections((previous) => [
      ...previous,
      {
        id: `s${previous.length + 1}`,
        title: `Chuong ${previous.length + 1}: Chuong moi`,
        lessons: [],
      },
    ]);
  };

  const renameSection = (sectionId) => {
    const currentSection = sections.find((section) => section.id === sectionId);

    if (!currentSection) {
      return;
    }

    setEditingSectionId(sectionId);
    setEditingText(currentSection.title);
  };

  const saveRename = () => {
    const normalizedTitle = editingText.trim();

    if (!normalizedTitle) {
      // eslint-disable-next-line no-alert
      alert('Ten chuong khong duoc de trong.');
      return;
    }

    setSections((previous) =>
      previous.map((section) => 
        section.id === editingSectionId ? { ...section, title: normalizedTitle } : section
      ),
    );

    setEditingSectionId(null);
    setEditingText('');
  };

  const cancelRename = () => {
    setEditingSectionId(null);
    setEditingText('');
  };

  const renameLesson = (sectionId, lessonId, currentTitle) => {
    setEditingLessonSectionId(sectionId);
    setEditingLessonId(lessonId);
    setEditingLessonText(currentTitle);
  };

  const saveRenameLeson = () => {
    const normalizedTitle = editingLessonText.trim();

    if (!normalizedTitle) {
      // eslint-disable-next-line no-alert
      alert('Ten bai giang khong duoc de trong.');
      return;
    }

    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== editingLessonSectionId) return section;
        return {
          ...section,
          lessons: section.lessons.map((lesson) =>
            lesson.id === editingLessonId ? { ...lesson, title: normalizedTitle } : lesson
          ),
        };
      }),
    );

    setEditingLessonId(null);
    setEditingLessonSectionId(null);
    setEditingLessonText('');
  };

  const cancelRenameLeson = () => {
    setEditingLessonId(null);
    setEditingLessonSectionId(null);
    setEditingLessonText('');
  };

  useEffect(() => {
    if (editInputRef.current && editingSectionId) {
      editInputRef.current.focus();
    }
  }, [editingSectionId]);

  useEffect(() => {
    if (editLessonInputRef.current && editingLessonId) {
      editLessonInputRef.current.focus();
    }
  }, [editingLessonId]);

  const saveDraft = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert('Đã lưu bản nháp (demo).');
  };

  const publishCourse = () => {
    // Placeholder action until API integration is ready.
    // eslint-disable-next-line no-alert
    alert('Đã gửi yêu cầu xuất bản khóa học (demo).');
  };

  const triggerFilePicker = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.click();
    }
  };

  const updateLessonFileState = (sectionId, lessonId, key, value) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          lessons: section.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, [key]: value } : lesson)),
        };
      }),
    );
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadMessage('Dang tai anh bia...');

    try {
      const result = await uploadTeacherFileApi(file, 'image');
      setCoverImageUrl(result.url || '');
      setCoverImageName(result.originalName || file.name);
      setUploadMessage('Tai anh bia thanh cong.');
    } catch (error) {
      setUploadMessage(error?.response?.data?.message || 'Tai anh bia that bai.');
    } finally {
      event.target.value = '';
    }
  };

  const handleLessonUpload = async (event, sectionId, lessonId, type) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadMessage(type === 'video' ? 'Dang tai video bai hoc...' : 'Dang tai tai lieu PDF...');

    try {
      const result = await uploadTeacherFileApi(file, type === 'video' ? 'video' : 'document');

      if (type === 'video') {
        updateLessonFileState(sectionId, lessonId, 'videoUrl', result.url || '');
        updateLessonFileState(sectionId, lessonId, 'videoName', result.originalName || file.name);
      } else {
        updateLessonFileState(sectionId, lessonId, 'pdfUrl', result.url || '');
        updateLessonFileState(sectionId, lessonId, 'pdfName', result.originalName || file.name);
      }

      setUploadMessage(type === 'video' ? 'Tai video thanh cong.' : 'Tai tai lieu PDF thanh cong.');
    } catch (error) {
      setUploadMessage(error?.response?.data?.message || 'Tai file that bai.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="instructor-course-builder-page">
      <aside className="instructor-course-builder-sidebar">
        <div className="instructor-course-builder-brand">
          <div className="instructor-course-builder-brand-icon">L</div>
          <span>LMS Admin</span>
        </div>

        <ul className="instructor-course-builder-nav-menu">
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/dashboard')} type="button">
              Tổng quan
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link active" onClick={() => navigate('/teacher/courses')} type="button">
              Quản lý khóa học
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/questions')} type="button">
              Ngân hàng câu hỏi
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/students')} type="button">
              Quản lý học viên
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/interaction')} type="button">
              Tương tác học viên
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/profile')} type="button">
              Hồ sơ giảng viên
            </button>
          </li>
          <li>
            <button className="instructor-course-builder-nav-link" onClick={() => navigate('/teacher/revenue')} type="button">
              Doanh thu
            </button>
          </li>
        </ul>

        <button className="instructor-course-builder-logout-btn" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="instructor-course-builder-main-content">
        <section className="instructor-course-builder-card">
          <h2 className="instructor-course-builder-card-title">Thống kê khóa học từ CSDL</h2>
          <p>Số khóa học của bạn: <b>{myCourses.length}</b></p>
          <p>Tổng học viên đăng ký: <b>{totalStudents}</b></p>
          {uploadMessage ? <p>{uploadMessage}</p> : null}
        </section>

        <header className="instructor-course-builder-header">
          <h1 className="instructor-course-builder-page-title">Tạo / Chỉnh sửa khóa học</h1>
          <div className="instructor-course-builder-header-actions">
            <button className="instructor-course-builder-btn instructor-course-builder-btn-draft" onClick={saveDraft} type="button">
              Lưu bản nháp
            </button>
            <button className="instructor-course-builder-btn instructor-course-builder-btn-primary" onClick={publishCourse} type="button">
              Xuất bản khóa học
            </button>
          </div>
        </header>

        <div className="instructor-course-builder-grid">
          <section className="instructor-course-builder-card">
            <h2 className="instructor-course-builder-card-title">Thông tin chung</h2>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="course-name">
                Tên khóa học
              </label>
              <input
                className="instructor-course-builder-form-control"
                id="course-name"
                onChange={(event) => setCourseName(event.target.value)}
                placeholder="Nhập tên khóa học (VD: Lập trình Flutter cơ bản)"
                type="text"
                value={courseName}
              />
            </div>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label" htmlFor="course-short-description">
                Mô tả ngắn
              </label>
              <textarea
                className="instructor-course-builder-form-control"
                id="course-short-description"
                onChange={(event) => setShortDescription(event.target.value)}
                placeholder="Mô tả tóm tắt nội dung khóa học..."
                value={shortDescription}
              />
            </div>

            <div className="instructor-course-builder-inline-fields">
              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="course-price">
                  Giá bán (VND)
                </label>
                <input
                  className="instructor-course-builder-form-control"
                  id="course-price"
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  value={price}
                />
              </div>

              <div className="instructor-course-builder-form-group">
                <label className="instructor-course-builder-form-label" htmlFor="specialization">
                  Chuyên ngành
                </label>
                <select
                  className="instructor-course-builder-form-control"
                  id="specialization"
                  onChange={(event) => setSpecialization(event.target.value)}
                  value={specialization}
                >
                  <option>Software Engineering</option>
                  <option>Trí tuệ nhân tạo (AI)</option>
                  <option>Hệ thống mạng</option>
                </select>
              </div>
            </div>

            <div className="instructor-course-builder-form-group">
              <label className="instructor-course-builder-form-label">Ảnh bìa khóa học (Thumbnail)</label>
              <button className="instructor-course-builder-upload-placeholder" onClick={() => coverInputRef.current?.click()} type="button">
                <div className="instructor-course-builder-upload-icon">IMG</div>
                <div className="instructor-course-builder-upload-text">
                  Kéo thả ảnh bìa hoặc <b>Click tải lên</b>
                  <br />
                  <span>(Kích thước khuyên nghi: 1280x720px)</span>
                </div>
              </button>
              <input accept="image/*" hidden onChange={handleCoverUpload} ref={coverInputRef} type="file" />
              {coverImageName ? <p>Đã tải: {coverImageName}</p> : null}
              {coverImageUrl ? <img alt="Ảnh bìa khóa học" src={coverImageUrl} style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} /> : null}
            </div>
          </section>

          <section className="instructor-course-builder-curriculum-wrap">
            <h2 className="instructor-course-builder-card-title">Chương trình học (Curriculum)</h2>

            {sections.map((section) => (
              <article className="instructor-course-builder-section-block" key={section.id}>
                <header className="instructor-course-builder-section-header">
                  {editingSectionId === section.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveRename();
                          } else if (e.key === 'Escape') {
                            cancelRename();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          fontSize: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                        }}
                      />
                      <button
                        className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                        onClick={saveRename}
                        type="button"
                      >
                        Luu
                      </button>
                      <button
                        className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                        onClick={cancelRename}
                        type="button"
                      >
                        Huy
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>{section.title}</span>
                      <button
                        className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                        onClick={(event) => {
                          event.stopPropagation();
                          renameSection(section.id);
                        }}
                        type="button"
                      >
                        Sua ten
                      </button>
                    </>
                  )}
                </header>

                <div className="instructor-course-builder-section-body">
                  {section.lessons.map((lesson) => (
                    <div className={`instructor-course-builder-lesson-item ${lesson.expanded ? 'expanded' : ''}`} key={lesson.id}>
                      {editingLessonId === lesson.id && editingLessonSectionId === section.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                          <div className="instructor-course-builder-drag-handle" />
                          <input
                            ref={editLessonInputRef}
                            type="text"
                            value={editingLessonText}
                            onChange={(e) => setEditingLessonText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveRenameLeson();
                              } else if (e.key === 'Escape') {
                                cancelRenameLeson();
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: '14px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                            }}
                          />
                          <button
                            className="instructor-course-builder-btn instructor-course-builder-btn-primary tiny"
                            onClick={saveRenameLeson}
                            type="button"
                          >
                            Luu
                          </button>
                          <button
                            className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                            onClick={cancelRenameLeson}
                            type="button"
                          >
                            Huy
                          </button>
                        </div>
                      ) : (
                        <div
                          className="instructor-course-builder-lesson-header"
                          onClick={() => toggleLessonExpanded(section.id, lesson.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleLessonExpanded(section.id, lesson.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="instructor-course-builder-drag-handle" />
                          <div className="instructor-course-builder-lesson-title">{lesson.title}</div>
                          <button
                            className="instructor-course-builder-btn instructor-course-builder-btn-draft tiny"
                            onClick={(event) => {
                              event.stopPropagation();
                              renameLesson(section.id, lesson.id, lesson.title);
                            }}
                            type="button"
                            style={{ marginLeft: 'auto' }}
                          >
                            Sua ten
                          </button>
                          <div className="instructor-course-builder-lesson-toggle">{lesson.expanded ? '▲' : '▼'}</div>
                        </div>
                      )}

                      {lesson.expanded ? (
                        <div className="instructor-course-builder-lesson-expanded-body">
                          <div className="instructor-course-builder-upload-actions">
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-outline-primary"
                              onClick={() => triggerFilePicker(`video-${section.id}-${lesson.id}`)}
                              type="button"
                            >
                              Tải lên Video (MP4)
                            </button>
                            <button
                              className="instructor-course-builder-btn instructor-course-builder-btn-outline-danger"
                              onClick={() => triggerFilePicker(`pdf-${section.id}-${lesson.id}`)}
                              type="button"
                            >
                              Tải lên Tài liệu (PDF)
                            </button>
                            <input
                              accept="video/mp4"
                              hidden
                              id={`video-${section.id}-${lesson.id}`}
                              onChange={(event) => handleLessonUpload(event, section.id, lesson.id, 'video')}
                              type="file"
                            />
                            <input
                              accept="application/pdf"
                              hidden
                              id={`pdf-${section.id}-${lesson.id}`}
                              onChange={(event) => handleLessonUpload(event, section.id, lesson.id, 'pdf')}
                              type="file"
                            />
                          </div>

                          {lesson.videoUrl ? (
                            <p>
                              Video: <a href={lesson.videoUrl} rel="noreferrer" target="_blank">{lesson.videoName || 'Xem video'}</a>
                            </p>
                          ) : null}

                          {lesson.pdfUrl ? (
                            <p>
                              Tài liệu: <a href={lesson.pdfUrl} rel="noreferrer" target="_blank">{lesson.pdfName || 'Xem PDF'}</a>
                            </p>
                          ) : null}

                          <div className="instructor-course-builder-form-group no-bottom">
                            <label className="instructor-course-builder-form-label">Văn bản bài học (Mô tả, ghi chú cho học viên)</label>
                            <textarea
                              className="instructor-course-builder-form-control instructor-course-builder-text-content"
                              placeholder="Nhập nội dung văn bản bài học..."
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <button className="instructor-course-builder-btn instructor-course-builder-btn-draft dashed full" onClick={() => addLesson(section.id)} type="button">
                    + Thêm Bài giảng mới
                  </button>
                </div>
              </article>
            ))}

            <button className="instructor-course-builder-btn instructor-course-builder-btn-primary full mt" onClick={addSection} type="button">
              + Thêm Chương mới (Section)
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ManHinhQuanLyKhoaHoc;
