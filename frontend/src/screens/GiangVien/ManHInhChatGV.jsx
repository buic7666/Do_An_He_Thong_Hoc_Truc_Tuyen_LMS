import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeacherInteractionsApi, replyTeacherInteractionApi } from '../../api/teacherApi';
import { logout } from '../../utils/authSession';

import './ManHInhChatGV.css';

const formatRelative = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN');
};

const getInitial = (name) => (name || 'H').trim().charAt(0).toUpperCase();

const getStars = (rating) => {
  const score = Math.max(0, Math.min(5, Number(rating || 0)));
  return `${'★'.repeat(score)}${'☆'.repeat(5 - score)}`;
};

function ManHInhChatGV() {
  const navigate = useNavigate();
    const handleLogout = () => {
      logout({ navigate });
    };
  const [activeTab, setActiveTab] = useState('qa');
  const [replies, setReplies] = useState({});
  const [qaThreads, setQaThreads] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInteractions = async () => {
    setIsLoading(true);

    try {
      const data = await fetchTeacherInteractionsApi();
      setQaThreads(Array.isArray(data?.qaThreads) ? data.qaThreads : []);
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } catch (_error) {
      setQaThreads([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, []);

  const qaCount = useMemo(() => qaThreads.length, [qaThreads]);

  const handleReplyChange = (threadId, value) => {
    setReplies((previous) => ({
      ...previous,
      [threadId]: value,
    }));
  };

  const handleSendReply = async (threadId, userName) => {
    const reply = (replies[threadId] ?? '').trim();
    if (!reply) {
      // eslint-disable-next-line no-alert
      alert('Vui long nhap cau tra loi truoc khi gui.');
      return;
    }

    try {
      await replyTeacherInteractionApi(threadId, { reply });
      // eslint-disable-next-line no-alert
      alert(`Da gui tra loi den ${userName}.`);
      await loadInteractions();
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error?.response?.data?.message || 'Khong the gui tra loi.');
      return;
    }

    setReplies((previous) => ({
      ...previous,
      [threadId]: '',
    }));
  };

  return (
    <div className="instructor-chat-page">
      <aside className="instructor-chat-sidebar">
        <div className="instructor-chat-brand">
          <div className="instructor-chat-brand-icon">L</div>
          <span>LMS Admin</span>
        </div>

        <ul className="instructor-chat-nav-menu">
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/dashboard')} type="button">
              Tổng quan
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/courses')} type="button">
              Quản lý khóa học
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/questions')} type="button">
              Ngân hàng câu hỏi
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/students')} type="button">
              Quản lý học viên
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link active" onClick={() => navigate('/teacher/interaction')} type="button">
              Tương tác học viên
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/profile')} type="button">
              Hồ sơ giảng viên
            </button>
          </li>
          <li>
            <button className="instructor-chat-nav-link" onClick={() => navigate('/teacher/revenue')} type="button">
              Doanh thu
            </button>
          </li>
        </ul>

              <button className="instructor-chat-logout-btn" type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
      </aside>

      <main className="instructor-chat-main-content">
        <h1 className="instructor-chat-page-title">Hoi dap & Danh gia</h1>

        <section className="instructor-chat-tabs-container">
          {isLoading ? <p>Dang tai du lieu tu CSDL...</p> : null}
          <div className="instructor-chat-tab-labels">
            <button className={`instructor-chat-tab-label ${activeTab === 'qa' ? 'active' : ''}`} onClick={() => setActiveTab('qa')} type="button">
              Hoi dap (Q&A)
              <span className="instructor-chat-tab-count">{qaCount}</span>
            </button>
            <button className={`instructor-chat-tab-label ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')} type="button">
              Danh gia (Reviews)
            </button>
          </div>

          {activeTab === 'qa' ? (
            <div className="instructor-chat-tab-panel">
              <div className="instructor-chat-thread-list">
                {qaThreads.map((thread) => (
                  <article className="instructor-chat-thread-card" key={thread.id}>
                    <header className="instructor-chat-thread-header">
                      <div className="instructor-chat-user-avatar">{getInitial(thread.userName)}</div>
                      <div className="instructor-chat-thread-meta">
                        <div className="instructor-chat-user-name">{thread.userName}</div>
                        <div>
                          <button className="instructor-chat-context-link" type="button">
                            {thread.context}
                          </button>
                          <span className="instructor-chat-time-stamp"> • {formatRelative(thread.createdAt)}</span>
                        </div>
                      </div>
                    </header>

                    <p className="instructor-chat-thread-body">{thread.content}</p>
                    {thread.reply ? <p className="instructor-chat-thread-body">Giang vien da tra loi: {thread.reply}</p> : null}

                    <div className="instructor-chat-reply-box">
                      <textarea
                        className="instructor-chat-reply-textarea"
                        onChange={(event) => handleReplyChange(thread.id, event.target.value)}
                        placeholder="Nhap cau tra loi cua ban tai day..."
                        value={replies[thread.id] ?? ''}
                      />
                      <div className="instructor-chat-reply-actions">
                        <button className="instructor-chat-btn instructor-chat-btn-primary" onClick={() => handleSendReply(thread.id, thread.userName)} type="button">
                          Tra loi
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!qaThreads.length ? <p>Chua co cau hoi nao.</p> : null}
              </div>
            </div>
          ) : (
            <div className="instructor-chat-tab-panel">
              <div className="instructor-chat-thread-list">
                {reviews.map((review) => (
                  <article className="instructor-chat-thread-card" key={review.id}>
                    <header className="instructor-chat-thread-header">
                      <div className="instructor-chat-user-avatar">{getInitial(review.userName)}</div>
                      <div className="instructor-chat-thread-meta">
                        <div className="instructor-chat-user-name">{review.userName}</div>
                        <span className="instructor-chat-time-stamp">{formatRelative(review.createdAt)}</span>
                      </div>
                    </header>

                    <div className="instructor-chat-stars-container">{getStars(review.rating)}</div>
                    <p className="instructor-chat-thread-body">{review.content}</p>
                    <div className="instructor-chat-course-badge">Khoa hoc: {review.context}</div>
                  </article>
                ))}
                {!reviews.length ? <p>Chua co danh gia nao.</p> : null}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ManHInhChatGV;
