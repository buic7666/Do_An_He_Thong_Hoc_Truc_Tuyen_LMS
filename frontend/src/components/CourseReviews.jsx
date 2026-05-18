import React, { useEffect, useState } from 'react';
import { fetchReviewsByCourseApi, createReviewApi } from '../api/teacherManagementApi';
import { getCurrentUserSafely, getAuthenticatedHomePath } from '../utils/authRedirect';
import './CourseReviews.css';

export default function CourseReviews({ courseId, showSubmit = true }) {
  const [data, setData] = useState({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = getCurrentUserSafely();

  useEffect(() => {
    if (!courseId) return;
    load();
  }, [courseId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchReviewsByCourseApi(courseId);
      setData(res || { averageRating: 0, totalReviews: 0, reviews: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setSubmitting(true);
    try {
      await createReviewApi({ courseId: Number(courseId), rating: Number(rating), comment });
      setRating(5);
      setComment('');
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="course-reviews">Đang tải đánh giá...</div>;

  return (
    <div className="course-reviews">
      <div className="reviews-summary">
        <div className="avg">{data.averageRating || 0} <span className="small">/5</span></div>
        <div className="count">{data.totalReviews} đánh giá</div>
      </div>

      {showSubmit && (
        <div className="reviews-submit">
          <label>Đánh giá:</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} sao</option>)}
          </select>
          <textarea placeholder="Viết nhận xét (tuỳ chọn)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button disabled={submitting} onClick={handleSubmit}>{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
        </div>
      )}

      <div className="reviews-list">
        {data.reviews.length === 0 && <div className="no-reviews">Chưa có đánh giá nào.</div>}
        {data.reviews.map((r) => (
          <div key={r.id} className="review-item">
            <div className="review-header"><strong>{r.userName || 'Học viên'}</strong> · <span className="rating">{r.rating}★</span></div>
            {r.comment ? <div className="review-comment">{r.comment}</div> : <div className="review-comment muted">(Không có nhận xét)</div>}
            <div className="review-meta">{new Date(r.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
