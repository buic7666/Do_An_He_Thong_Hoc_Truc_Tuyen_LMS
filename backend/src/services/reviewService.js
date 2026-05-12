const Review = require('../models/review.model');
const User = require('../models/user.model');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }
  return id;
};

const createReview = async (payload, currentUser) => {
  const courseId = parseId(payload.courseId, 'courseId');
  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'rating must be integer between 1 and 5', 'VALIDATION_ERROR');
  }

  const review = await Review.create({
    courseId,
    chapterId: payload.chapterId || null,
    lessonId: payload.lessonId || null,
    userId: currentUser.id,
    rating,
    comment: payload.comment || null,
  });

  return review.toJSON();
};

const fetchReviewsByCourse = async (courseId) => {
  const cid = parseId(courseId, 'courseId');
  // aggregate
  const { sequelize } = require('../config/database');
  const [agg] = await sequelize.query(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
     FROM reviews WHERE course_id = :cid`,
    { replacements: { cid }, type: sequelize.QueryTypes.SELECT },
  );

  // fetch recent reviews with user name
  const reviews = await Review.findAll({ where: { courseId: cid }, order: [['created_at', 'DESC']], limit: 50 });
  const userIds = Array.from(new Set(reviews.map((r) => r.userId)));
  const users = userIds.length ? await User.findAll({ where: { id: userIds } }) : [];
  const uMap = users.reduce((acc, u) => { acc[u.id] = u.toJSON(); return acc; }, {});

  const mapped = reviews.map((r) => {
    const ro = r.toJSON();
    return {
      id: ro.id,
      rating: ro.rating,
      comment: ro.comment,
      userId: ro.userId,
      userName: uMap[ro.userId]?.name || null,
      createdAt: ro.createdAt || ro.created_at,
    };
  });

  return {
    averageRating: agg?.avg_rating ? Number(Number(agg.avg_rating).toFixed(2)) : 0,
    totalReviews: Number(agg?.total_reviews || 0),
    reviews: mapped,
  };
};

module.exports = {
  createReview,
  fetchReviewsByCourse,
};
