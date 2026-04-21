import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCourseDetailApi, fetchCourseProgressApi } from '../../api/courseApi';
import { fetchMyEnrollmentsApi } from '../../api/enrollmentApi';
import {
  fetchLessonDetailApi,
  fetchLessonWatchPositionApi,
  markLessonCompletedApi,
  saveLessonWatchPositionApi,
} from '../../api/lessonApi';
import './ManHinhHocTap.css';

const tabs = [
  { id: 'overview', label: 'Tổng quan bài học' },
  { id: 'documents', label: 'Tài liệu PDF' },
  { id: 'notes', label: 'Ghi chú cá nhân' },
];

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const normalizeYouTubeVideoId = (candidate) => {
  if (!candidate) return null;

  const trimmed = String(candidate).trim();
  const id = trimmed.split(/[?&#/]/)[0];
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
};

const getYouTubeVideoId = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      return normalizeYouTubeVideoId(url.pathname.slice(1));
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return normalizeYouTubeVideoId(url.searchParams.get('v'));
      }

      if (url.pathname.startsWith('/embed/')) {
        return normalizeYouTubeVideoId(url.pathname.split('/embed/')[1]);
      }

      if (url.pathname.startsWith('/shorts/')) {
        return normalizeYouTubeVideoId(url.pathname.split('/shorts/')[1]);
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
};

function ManHinhHocTap() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentLessonDetail, setCurrentLessonDetail] = useState(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [iframeStartSeconds, setIframeStartSeconds] = useState(0);
  const [iframeResumeNonce, setIframeResumeNonce] = useState(0);
  const [positionSaveMessage, setPositionSaveMessage] = useState('');
  const [courseProgress, setCourseProgress] = useState(null);

  const initialQueryRef = useRef(null);
  const lessonSessionStartAtRef = useRef(null);
  const lessonBaseSecondsRef = useRef(0);
  const lastSavedSecondsRef = useRef(0);
  const autoSaveIntervalRef = useRef(null);
  const currentLessonIdRef = useRef(null);

  if (!initialQueryRef.current && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    initialQueryRef.current = {
      courseId: params.get('courseId'),
      lessonId: params.get('lessonId'),
    };
  }

  const selectedCourseId = initialQueryRef.current?.courseId || null;
  const selectedLessonId = initialQueryRef.current?.lessonId || null;

  const getEstimatedPositionSeconds = useCallback(() => {
    const startedAt = lessonSessionStartAtRef.current;
    const base = Number(lessonBaseSecondsRef.current || 0);

    if (!startedAt) {
      return Math.max(0, Math.floor(base));
    }

    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return Math.max(0, Math.floor(base + elapsed));
  }, []);

  const persistLessonPosition = useCallback(
    async (lessonId, { force = false } = {}) => {
      const parsedLessonId = Number(lessonId || currentLessonIdRef.current);
      if (!parsedLessonId) {
        return;
      }

      const estimatedSeconds = getEstimatedPositionSeconds();
      const delta = Math.abs(estimatedSeconds - Number(lastSavedSecondsRef.current || 0));

      if (!force && delta < 5) {
        return;
      }

      try {
        await saveLessonWatchPositionApi(parsedLessonId, estimatedSeconds);
        lastSavedSecondsRef.current = estimatedSeconds;

        if (force) {
          setPositionSaveMessage(`Đã lưu mốc ${formatDuration(estimatedSeconds)} cho bài hiện tại.`);
        }
      } catch (_error) {
        if (force) {
          setPositionSaveMessage('Không lưu được vị trí xem.');
        }
      }
    },
    [getEstimatedPositionSeconds],
  );

  const syncUrlParams = useCallback((courseId, lessonId) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (courseId) {
      url.searchParams.set('courseId', String(courseId));
    }
    if (lessonId) {
      url.searchParams.set('lessonId', String(lessonId));
    }

    window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
  }, []);

  const currentLesson = useMemo(
    () => lessons.find((lesson) => Number(lesson.id) === Number(currentLessonId)) || null,
    [lessons, currentLessonId],
  );

  const currentVideoId = useMemo(() => getYouTubeVideoId(currentLesson?.videoUrl), [currentLesson?.videoUrl]);

  const currentEmbedUrl = useMemo(() => {
    if (!currentVideoId) {
      return '';
    }

    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
    });

    if (iframeStartSeconds > 0) {
      params.set('start', String(Math.max(1, Math.floor(iframeStartSeconds))));
      params.set('autoplay', '1');
    }

    return `https://www.youtube.com/embed/${currentVideoId}?${params.toString()}`;
  }, [currentVideoId, iframeStartSeconds]);

  const completedLessonIdSet = useMemo(() => {
    const ids = Array.isArray(courseProgress?.completedLessonIds) ? courseProgress.completedLessonIds : [];
    return new Set(ids.map((id) => Number(id)).filter(Boolean));
  }, [courseProgress?.completedLessonIds]);

  const completedLessons = Number(courseProgress?.completedLessons || 0);
  const totalLessons = Number(courseProgress?.totalLessons || lessons.length || 0);
  const completionPercent = Number(courseProgress?.completionPercent || 0);

  const refreshCourseProgress = useCallback(async (courseId) => {
    if (!courseId) return;

    try {
      const progress = await fetchCourseProgressApi(courseId);
      setCourseProgress(progress);
    } catch (_error) {
      setCourseProgress(null);
    }
  }, []);

  const loadLessonData = useCallback(async (lessonId) => {
    if (!lessonId) {
      setCurrentLessonDetail(null);
      setResumeSeconds(0);
      setIframeStartSeconds(0);
      return;
    }

    const [lessonDetail, watchPosition] = await Promise.all([
      fetchLessonDetailApi(lessonId),
      fetchLessonWatchPositionApi(lessonId),
    ]);

    setCurrentLessonDetail(lessonDetail);
    const seconds = Number(watchPosition?.positionSeconds || 0);
    setResumeSeconds(seconds);
    setIframeStartSeconds(0);
    setIframeResumeNonce(0);
    lessonBaseSecondsRef.current = seconds;
    lessonSessionStartAtRef.current = Date.now();
    lastSavedSecondsRef.current = seconds;
    currentLessonIdRef.current = Number(lessonId);
    setPositionSaveMessage(seconds > 0 ? `Đã tìm thấy mốc ${formatDuration(seconds)}` : 'Bắt đầu từ đầu bài học.');
  }, []);

  useEffect(() => {
    currentLessonIdRef.current = Number(currentLessonId || 0) || null;
  }, [currentLessonId]);

  useEffect(() => {
    if (!currentLessonId) {
      return undefined;
    }

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    autoSaveIntervalRef.current = setInterval(() => {
      const estimated = getEstimatedPositionSeconds();
      setResumeSeconds(estimated);
      persistLessonPosition(currentLessonId, { force: false });
    }, 5000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [currentLessonId, getEstimatedPositionSeconds, persistLessonPosition]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const lessonId = Number(currentLessonIdRef.current || 0);
        if (lessonId) {
          persistLessonPosition(lessonId, { force: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const lessonId = Number(currentLessonIdRef.current || 0);
      if (lessonId) {
        persistLessonPosition(lessonId, { force: true });
      }
    };
  }, [persistLessonPosition]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapStudyWorkspace = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const enrollments = await fetchMyEnrollmentsApi();
        const enrolledList = Array.isArray(enrollments) ? enrollments : [];

        if (enrolledList.length === 0) {
          throw new Error('Bạn chưa đăng ký khóa học nào. Hãy enroll một khóa học trước.');
        }

        const firstEnrollment = enrolledList[0];
        const fallbackCourseId = String(firstEnrollment.courseId);
        const resolvedCourseId = selectedCourseId || fallbackCourseId;

        const course = await fetchCourseDetailApi(resolvedCourseId);
        const sortedLessons = [...(Array.isArray(course.lessons) ? course.lessons : [])].sort(
          (left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0),
        );

        if (sortedLessons.length === 0) {
          throw new Error('Khóa học hiện chưa có bài học nào để xem.');
        }

        const fallbackLessonId = String(sortedLessons[0].id);
        const resolvedLessonId = selectedLessonId || fallbackLessonId;

        if (!isCancelled) {
          setCourseDetail(course);
          setLessons(sortedLessons);
          setCurrentLessonId(Number(resolvedLessonId));
          await loadLessonData(Number(resolvedLessonId));
          await refreshCourseProgress(resolvedCourseId);
          syncUrlParams(resolvedCourseId, resolvedLessonId);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error?.response?.data?.message || error?.message || 'Không tải được dữ liệu học tập.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    bootstrapStudyWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [loadLessonData, refreshCourseProgress, selectedCourseId, selectedLessonId, syncUrlParams]);

  const handleSelectLesson = async (lessonId) => {
    if (Number(lessonId) === Number(currentLessonId)) {
      return;
    }

    try {
      setErrorMessage('');
      await persistLessonPosition(currentLessonId, { force: true });

      const parsedLessonId = Number(lessonId);
      setCurrentLessonId(parsedLessonId);
      await loadLessonData(parsedLessonId);
      syncUrlParams(selectedCourseId || courseDetail?.id, parsedLessonId);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Không thể chuyển sang bài học này.';
      setErrorMessage(message);
    }
  };

  const handleResume = () => {
    const startAt = Math.max(0, Math.floor(Number(resumeSeconds || 0)));

    if (startAt > 0) {
      setIframeStartSeconds(startAt);
      setIframeResumeNonce((prev) => prev + 1);
      lessonBaseSecondsRef.current = startAt;
      lessonSessionStartAtRef.current = Date.now();
      setPositionSaveMessage(`Tiếp tục từ mốc ${formatDuration(startAt)}.`);
      return;
    }

    setPositionSaveMessage('Bài học này chưa có mốc lưu trước đó.');
  };

  const handleMarkCompleted = async () => {
    if (!currentLessonId) return;

    try {
      await persistLessonPosition(currentLessonId, { force: true });
      await markLessonCompletedApi(currentLessonId);
      await refreshCourseProgress(selectedCourseId || courseDetail?.id);
      setPositionSaveMessage('Đã đánh dấu hoàn thành bài học hiện tại.');
    } catch (_error) {
      setPositionSaveMessage('Không thể đánh dấu hoàn thành bài học.');
    }
  };

  const handleOpenCurrentVideoOnYoutube = () => {
    if (!currentVideoId) return;

    window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return <div className='study-workspace-page study-loading-state'>Đang tải dữ liệu học tập...</div>;
  }

  if (errorMessage) {
    return <div className='study-workspace-page study-loading-state'>{errorMessage}</div>;
  }

  return (
    <div className='study-workspace-page'>
      <header className='study-top-header'>
        <a href='/dashboard' className='study-back-btn'>
          ← Quay lại Dashboard
        </a>
        <div className='study-course-title-header'>{courseDetail?.title || 'Không có khóa học'}</div>
      </header>

      <div className='study-workspace'>
        <section className='study-main-content'>
          <div className='study-resume-alert'>
            <p className='study-resume-text'>
              Bạn đang dừng lại ở <strong>{formatDuration(resumeSeconds)}</strong> của bài học hiện tại.
            </p>
            <button type='button' className='study-btn-resume' onClick={handleResume}>
              ▶ Tiếp tục học
            </button>
          </div>

          <div className='study-video-wrapper'>
            {currentEmbedUrl ? (
              <iframe
                key={`iframe-${currentLessonId}-${iframeStartSeconds}-${iframeResumeNonce}`}
                className='study-youtube-player'
                src={currentEmbedUrl}
                title={currentLesson?.title || 'Lesson video'}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                allowFullScreen
              />
            ) : (
              <div className='study-player-error-overlay'>
                <p>Video hiện tại chưa phải YouTube URL hợp lệ.</p>
                <button type='button' className='study-btn-resume' onClick={handleOpenCurrentVideoOnYoutube}>
                  Mở trên YouTube
                </button>
              </div>
            )}
          </div>

          <div className='study-tabs-container'>
            <div className='study-tabs-header'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type='button'
                  className={`study-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className='study-tab-content'>
              {activeTab === 'overview' && (
                <div className='study-tab-pane'>
                  <h2 className='study-lesson-title'>{currentLesson?.title || 'Bài học'}</h2>
                  <p>{currentLessonDetail?.content || currentLesson?.content || 'Nội dung đang cập nhật.'}</p>
                  <ul className='study-overview-list'>
                    <li>Đổi bài học sẽ đổi video ngay trong iframe, không cần reload trang.</li>
                    <li>Mốc học được tự động lưu mỗi 5 giây cho từng bài học.</li>
                    <li>Tiến độ hoàn thành hiển thị theo từng bài học.</li>
                  </ul>
                  <button type='button' className='study-btn-resume study-btn-save-note' onClick={handleMarkCompleted}>
                    Đánh dấu hoàn thành bài học
                  </button>
                  {positionSaveMessage ? <p className='study-position-message'>{positionSaveMessage}</p> : null}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className='study-tab-pane'>
                  <h2 className='study-lesson-title'>Tài liệu tham khảo</h2>
                  <p>Demo hiện tập trung vào luồng học video YouTube ổn định trong iframe.</p>
                  <p>Khi bạn có URL PDF thật, có thể hiển thị tại đây theo từng bài học.</p>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className='study-tab-pane'>
                  <h2 className='study-lesson-title'>Ghi chú của bạn</h2>
                  <textarea className='study-note-input' placeholder='Thêm ghi chú tại mốc thời gian hiện tại...' />
                  <button type='button' className='study-btn-resume study-btn-save-note'>
                    Lưu ghi chú
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className='study-sidebar'>
          <div className='study-sidebar-header'>
            <h3 className='study-sidebar-title'>Nội dung khóa học</h3>
            <p className='study-progress-text'>
              Đã hoàn thành {completedLessons}/{totalLessons} bài học ({completionPercent}%)
            </p>
          </div>

          <div className='study-course-content'>
            <article className='study-chapter'>
              <header className='study-chapter-title'>
                <span>Nội dung khóa học</span>
                <span>{lessons.length} bài</span>
              </header>

              <div>
                {lessons.map((lesson) => {
                  const isActive = Number(lesson.id) === Number(currentLessonId);
                  const isCompleted = completedLessonIdSet.has(Number(lesson.id));

                  return (
                    <button
                      key={lesson.id}
                      type='button'
                      className={`study-lesson-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleSelectLesson(lesson.id)}
                    >
                      <span
                        className={`study-lesson-icon ${isActive ? 'study-icon-playing' : isCompleted ? 'study-icon-done' : 'study-icon-lock'}`}
                      >
                        {isActive ? '▶' : isCompleted ? '✔' : '○'}
                      </span>
                      <span className={`study-lesson-name ${isCompleted ? 'is-done' : ''}`}>{lesson.title}</span>
                      <span className='study-lesson-duration'>#{lesson.orderIndex}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ManHinhHocTap;
