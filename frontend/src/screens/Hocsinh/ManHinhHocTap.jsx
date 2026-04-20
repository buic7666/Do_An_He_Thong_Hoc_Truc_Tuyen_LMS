import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const YOUTUBE_PLAYER_ELEMENT_ID = 'study-youtube-player';

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getYouTubeVideoId = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      return url.pathname.slice(1) || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }

      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/embed/')[1] || null;
      }

      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/shorts/')[1] || null;
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const loadYouTubeIframeApi = () => {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (window.__youtubeIframeApiPromise) {
    return window.__youtubeIframeApiPromise;
  }

  window.__youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-youtube-iframe-api="true"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeIframeApi = 'true';
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT);
    };
  });

  return window.__youtubeIframeApiPromise;
};

function ManHinhHocTap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [courseDetail, setCourseDetail] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentLessonDetail, setCurrentLessonDetail] = useState(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [positionSaveMessage, setPositionSaveMessage] = useState('');
  const [courseProgress, setCourseProgress] = useState(null);

  const playerRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const lastSavedSecondsRef = useRef(-1);

  const selectedCourseId = searchParams.get('courseId');
  const selectedLessonId = searchParams.get('lessonId');

  const currentLesson = useMemo(
    () => lessons.find((lesson) => Number(lesson.id) === Number(currentLessonId)) || null,
    [lessons, currentLessonId],
  );

  const completedLessons = Number(courseProgress?.completedLessons || 0);
  const totalLessons = Number(courseProgress?.totalLessons || lessons.length || 0);
  const completionPercent = Number(courseProgress?.completionPercent || 0);

  const persistCurrentPosition = useCallback(
    async (force = false) => {
      if (!playerRef.current || !currentLessonId) {
        return;
      }

      const currentSeconds = Math.max(0, Math.floor(playerRef.current.getCurrentTime?.() || 0));
      if (!force && Math.abs(currentSeconds - lastSavedSecondsRef.current) < 5) {
        return;
      }

      try {
        await saveLessonWatchPositionApi(currentLessonId, currentSeconds);
        lastSavedSecondsRef.current = currentSeconds;
        setPositionSaveMessage(`Đã lưu mốc ${formatDuration(currentSeconds)}`);
      } catch (_error) {
        setPositionSaveMessage('Không lưu được vị trí xem.');
      }
    },
    [currentLessonId],
  );

  const refreshCourseProgress = useCallback(
    async (courseId) => {
      if (!courseId) return;

      try {
        const progress = await fetchCourseProgressApi(courseId);
        setCourseProgress(progress);
      } catch (_error) {
        setCourseProgress(null);
      }
    },
    [],
  );

  const loadLessonData = useCallback(
    async (lessonId) => {
      if (!lessonId) {
        setCurrentLessonDetail(null);
        setResumeSeconds(0);
        return;
      }

      const [lessonDetail, watchPosition] = await Promise.all([
        fetchLessonDetailApi(lessonId),
        fetchLessonWatchPositionApi(lessonId),
      ]);

      setCurrentLessonDetail(lessonDetail);
      const seconds = Number(watchPosition?.positionSeconds || 0);
      setResumeSeconds(seconds);
      lastSavedSecondsRef.current = seconds;
      setPositionSaveMessage(seconds > 0 ? `Đã tìm thấy mốc ${formatDuration(seconds)}` : 'Bắt đầu từ đầu bài học.');
    },
    [],
  );

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

          setSearchParams({
            courseId: String(resolvedCourseId),
            lessonId: String(resolvedLessonId),
          });
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
  }, [loadLessonData, refreshCourseProgress, selectedCourseId, selectedLessonId, setSearchParams]);

  useEffect(() => {
    let isCancelled = false;

    const createPlayer = async () => {
      const videoId = getYouTubeVideoId(currentLesson?.videoUrl);

      if (!videoId) {
        setPositionSaveMessage('Video hiện tại chưa phải YouTube URL hợp lệ.');
        return;
      }

      const YT = await loadYouTubeIframeApi();
      if (isCancelled) return;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new YT.Player(YOUTUBE_PLAYER_ELEMENT_ID, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (resumeSeconds > 0) {
              event.target.seekTo(resumeSeconds, true);
            }

            if (saveIntervalRef.current) {
              clearInterval(saveIntervalRef.current);
            }

            saveIntervalRef.current = setInterval(async () => {
              const state = event.target.getPlayerState?.();
              if (state === YT.PlayerState.PLAYING) {
                await persistCurrentPosition(false);
              }
            }, 5000);
          },
          onStateChange: async (event) => {
            if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
              await persistCurrentPosition(true);
            }

            if (event.data === YT.PlayerState.ENDED && currentLessonId) {
              try {
                await markLessonCompletedApi(currentLessonId);
                await refreshCourseProgress(selectedCourseId);
              } catch (_error) {
                // Ignore completion errors so player flow is uninterrupted.
              }
            }
          },
        },
      });
    };

    if (currentLesson?.videoUrl && currentLessonId) {
      createPlayer();
    }

    return () => {
      isCancelled = true;

      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }

      persistCurrentPosition(true);

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentLesson?.videoUrl, currentLessonId, persistCurrentPosition, refreshCourseProgress, resumeSeconds, selectedCourseId]);

  const handleSelectLesson = async (lessonId) => {
    if (Number(lessonId) === Number(currentLessonId)) {
      return;
    }

    await persistCurrentPosition(true);
    setCurrentLessonId(Number(lessonId));
    await loadLessonData(Number(lessonId));

    setSearchParams({
      courseId: String(selectedCourseId || courseDetail?.id || ''),
      lessonId: String(lessonId),
    });
  };

  const handleResume = () => {
    if (playerRef.current && resumeSeconds > 0) {
      playerRef.current.seekTo(resumeSeconds, true);
      playerRef.current.playVideo();
    }
  };

  const handleMarkCompleted = async () => {
    if (!currentLessonId) return;

    try {
      await markLessonCompletedApi(currentLessonId);
      await refreshCourseProgress(selectedCourseId);
      setPositionSaveMessage('Đã đánh dấu hoàn thành bài học hiện tại.');
    } catch (_error) {
      setPositionSaveMessage('Không thể đánh dấu hoàn thành bài học.');
    }
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
            <div id={YOUTUBE_PLAYER_ELEMENT_ID} className='study-youtube-player' />
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
                    <li>Video sử dụng YouTube IFrame API thật, không phải ảnh mock.</li>
                    <li>Vị trí xem được tự động lưu theo giây mỗi 5 giây.</li>
                    <li>Chuyển bài học vẫn giữ resume theo từng lesson.</li>
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
                  <p>Demo hiện tập trung vào luồng video YouTube + đồng bộ vị trí xem theo giây.</p>
                  <p>Khi bạn có URL PDF thật, có thể hiển thị tại đây theo từng bài học.</p>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className='study-tab-pane'>
                  <h2 className='study-lesson-title'>Ghi chú của bạn</h2>
                  <textarea
                    className='study-note-input'
                    placeholder='Thêm ghi chú tại mốc thời gian hiện tại...'
                  />
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

                  return (
                    <button
                      key={lesson.id}
                      type='button'
                      className={`study-lesson-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleSelectLesson(lesson.id)}
                    >
                      <span className={`study-lesson-icon ${isActive ? 'study-icon-playing' : 'study-icon-done'}`}>
                        {isActive ? '▶' : '✔'}
                      </span>
                      <span className={`study-lesson-name ${isActive ? '' : 'is-done'}`}>{lesson.title}</span>
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
