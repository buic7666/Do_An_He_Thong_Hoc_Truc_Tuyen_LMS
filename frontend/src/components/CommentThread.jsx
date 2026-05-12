import React, { useState, useEffect } from 'react';
import { getCommentsApi, createCommentApi, deleteCommentApi, updateCommentApi } from '../api/teacherManagementApi';
import { getCurrentUserSafely } from '../utils/authRedirect';
import './CommentThread.css';

export default function CommentThread({ courseId, lessonId = null, chapterId = null, type = 'lesson' }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const currentUser = getCurrentUserSafely();

  useEffect(() => {
    loadComments();
  }, [courseId, lessonId, chapterId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getCommentsApi(courseId, lessonId, chapterId);
      setComments(data);
      setError('');
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Không thể tải bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim()) {
      setError('Vui lòng nhập bình luận.');
      return;
    }

    if (!currentUser) {
      setError('Vui lòng đăng nhập để bình luận.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        courseId: parseInt(courseId, 10),
        lessonId: lessonId ? parseInt(lessonId, 10) : null,
        chapterId: chapterId ? parseInt(chapterId, 10) : null,
        content: newCommentText,
      };

      await createCommentApi(payload);
      setNewCommentText('');
      setError('');
      await loadComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Không thể đăng bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      setError('Vui lòng nhập trả lời.');
      return;
    }

    if (!currentUser) {
      setError('Vui lòng đăng nhập để trả lời.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        courseId: parseInt(courseId, 10),
        lessonId: lessonId ? parseInt(lessonId, 10) : null,
        chapterId: chapterId ? parseInt(chapterId, 10) : null,
        content: replyText,
        parentCommentId: replyingTo,
      };

      await createCommentApi(payload);
      setReplyText('');
      setReplyingTo(null);
      setError('');
      await loadComments();
    } catch (err) {
      console.error('Failed to post reply:', err);
      setError('Không thể đăng trả lời. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteCommentApi(commentId);
      setError('');
      await loadComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      setError('Vui lòng nhập nội dung.');
      return;
    }

    try {
      await updateCommentApi(commentId, { content: editText });
      setEditingId(null);
      setEditText('');
      setError('');
      await loadComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
      setError('Không thể chỉnh sửa bình luận. Vui lòng thử lại.');
    }
  };

  const renderComment = (comment, isReply = false) => {
    const isOwnComment = currentUser?.id === comment.userId;
    const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

    return (
      <div key={comment.id} className={`comment ${isReply ? 'reply' : 'top-level'}`}>
        <div className="comment-header">
          <div className="comment-meta">
            <strong className="comment-author">{comment.author?.name}</strong>
            <span className="comment-time">
              {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {comment.author?.role && <span className="comment-role">{comment.author.role === 'teacher' ? '(GV)' : ''}</span>}
          </div>
          {(isOwnComment || isTeacher) && (
            <div className="comment-actions">
              <button
                className="btn-small edit-btn"
                onClick={() => {
                  setEditingId(comment.id);
                  setEditText(comment.content);
                }}
              >
                Sửa
              </button>
              <button
                className="btn-small delete-btn"
                onClick={() => handleDeleteComment(comment.id)}
              >
                Xóa
              </button>
            </div>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="comment-edit">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button className="btn-save" onClick={() => handleEditComment(comment.id)}>
                Lưu
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditingId(null);
                  setEditText('');
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="comment-content">{comment.content}</div>

            {!isReply && currentUser && (
              <button
                className="btn-reply"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                {replyingTo === comment.id ? 'Ẩn trả lời' : 'Trả lời'}
              </button>
            )}
          </>
        )}

        {replyingTo === comment.id && (
          <div className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập trả lời của bạn..."
              className="reply-textarea"
            />
            <div className="reply-actions">
              <button
                className="btn-submit"
                onClick={handleReply}
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi trả lời'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-section">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comment-thread">
      <h3 className="thread-title">💬 Bình Luận ({comments.length})</h3>

      {error && <div className="error-message">{error}</div>}

      {!currentUser && (
        <div className="login-prompt">
          Vui lòng <a href="/login">đăng nhập</a> để bình luận.
        </div>
      )}

      {currentUser && (
        <div className="new-comment-form">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Nhập bình luận của bạn..."
            className="comment-textarea"
            rows="3"
          />
          <div className="form-actions">
            <button
              className="btn-submit"
              onClick={handlePostComment}
              disabled={submitting || !newCommentText.trim()}
            >
              {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </div>
        </div>
      )}

      <div className="comments-list">
        {loading ? (
          <p className="loading">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
