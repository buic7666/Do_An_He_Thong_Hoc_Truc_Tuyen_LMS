const { Op } = require('sequelize');

const { Comment, Course, Enrollment, TeacherInteraction, User } = require('../models');
const Review = require('../models/review.model');
const { HttpError } = require('../utils/httpError');

const DIRECT_MESSAGE_PREFIX = '[TEACHER_STUDENT_MESSAGE]';

const getTeacherCourseScope = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const where = currentUser.role === 'admin' ? {} : { instructorId: currentUser.id };
  const courses = await Course.findAll({
    where,
    attributes: ['id', 'title', 'instructorId'],
    order: [['createdAt', 'DESC']],
  });

  const courseMap = new Map();
  courses.forEach((course) => {
    const plain = course.toJSON();
    courseMap.set(Number(plain.id), plain);
  });

  return {
    courseIds: courses.map((course) => Number(course.id)),
    courseMap,
  };
};

const buildUserMap = async (userIds) => {
  const normalizedIds = [...new Set(userIds.map((id) => Number(id)).filter(Boolean))];
  if (!normalizedIds.length) {
    return new Map();
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: normalizedIds } },
    attributes: ['id', 'name', 'email', 'role'],
  });

  return new Map(users.map((user) => {
    const plain = user.toJSON();
    return [Number(plain.id), plain];
  }));
};

const getLatestTeacherReply = (comment, replies, userMap) => {
  const relatedReplies = replies
    .filter((reply) => Number(reply.parentCommentId) === Number(comment.id))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  const teacherReply = relatedReplies.find((reply) => {
    const author = userMap.get(Number(reply.userId));
    return author?.role === 'teacher' || author?.role === 'admin';
  });

  return teacherReply?.content || '';
};

const normalizeCommentThread = (comment, replies, userMap, courseMap) => {
  const author = userMap.get(Number(comment.userId));
  const course = courseMap.get(Number(comment.courseId));

  return {
    id: comment.id,
    type: 'qa',
    userName: author?.name || author?.email || 'Hoc vien',
    context: course?.title || 'Khoa hoc',
    content: comment.content,
    rating: null,
    reply: getLatestTeacherReply(comment, replies, userMap),
    createdAt: comment.createdAt,
    courseId: comment.courseId,
    chapterId: comment.chapterId,
    lessonId: comment.lessonId,
    source: 'comment',
  };
};

const normalizeReview = (review, userMap, courseMap) => {
  const author = userMap.get(Number(review.userId));
  const course = courseMap.get(Number(review.courseId));

  return {
    id: review.id,
    type: 'review',
    userName: author?.name || author?.email || 'Hoc vien',
    context: course?.title || 'Khoa hoc',
    content: review.comment || '',
    rating: review.rating,
    reply: '',
    createdAt: review.createdAt,
    courseId: review.courseId,
    chapterId: review.chapterId,
    lessonId: review.lessonId,
  };
};

const normalizeDirectMessage = (item) => {
  const plain = item.toJSON ? item.toJSON() : item;
  const content = String(plain.content || '').startsWith(DIRECT_MESSAGE_PREFIX)
    ? String(plain.content || '').slice(DIRECT_MESSAGE_PREFIX.length).trim()
    : plain.content;

  return {
    id: plain.id,
    type: plain.type,
    userName: plain.userName,
    context: plain.context,
    content,
    rating: plain.rating,
    reply: plain.reply || '',
    createdAt: plain.createdAt,
    source: 'teacher_message',
  };
};

const getInteractions = async (currentUser) => {
  const { courseIds, courseMap } = await getTeacherCourseScope(currentUser);
  if (!courseIds.length) {
    return {
      qaThreads: [],
      reviews: [],
    };
  }

  const [comments, reviews, directMessages] = await Promise.all([
    Comment.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    }),
    Review.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    }),
    TeacherInteraction.findAll({
      where: {
        teacherId: currentUser.id,
        type: 'qa',
        content: { [Op.like]: `${DIRECT_MESSAGE_PREFIX}%` },
      },
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const topLevelComments = comments.filter((comment) => !comment.parentCommentId);
  const replyComments = comments.filter((comment) => comment.parentCommentId);
  const userMap = await buildUserMap([
    ...comments.map((comment) => comment.userId),
    ...reviews.map((review) => review.userId),
  ]);

  const commentThreads = topLevelComments
    .filter((comment) => {
      const author = userMap.get(Number(comment.userId));
      return author?.role !== 'teacher' && author?.role !== 'admin';
    })
    .map((comment) => normalizeCommentThread(comment, replyComments, userMap, courseMap));

  const qaThreads = [
    ...commentThreads,
    ...directMessages.map(normalizeDirectMessage),
  ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return {
    qaThreads,
    reviews: reviews.map((review) => normalizeReview(review, userMap, courseMap)),
  };
};

const replyInteraction = async (id, payload, currentUser) => {
  const { courseIds, courseMap } = await getTeacherCourseScope(currentUser);
  if (!courseIds.length) {
    throw new HttpError(404, 'Interaction not found', 'INTERACTION_NOT_FOUND');
  }

  const comment = await Comment.findOne({
    where: {
      id,
      courseId: { [Op.in]: courseIds },
      parentCommentId: null,
    },
    raw: true,
  });

  if (!comment) {
    throw new HttpError(404, 'Interaction not found', 'INTERACTION_NOT_FOUND');
  }

  await Comment.create({
    courseId: comment.courseId,
    chapterId: comment.chapterId || null,
    lessonId: comment.lessonId || null,
    userId: currentUser.id,
    content: payload.reply,
    parentCommentId: comment.id,
  });

  const replies = await Comment.findAll({
    where: { parentCommentId: comment.id },
    order: [['createdAt', 'DESC']],
    raw: true,
  });

  const userMap = await buildUserMap([
    comment.userId,
    currentUser.id,
    ...replies.map((reply) => reply.userId),
  ]);

  return normalizeCommentThread(comment, replies, userMap, courseMap);
};

const sendStudentMessage = async (payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const enrollment = await Enrollment.findOne({
    where: {
      userId: payload.userId,
      courseId: payload.courseId,
      status: 'active',
    },
    include: [
      {
        model: Course,
        as: 'course',
        required: true,
        attributes: ['id', 'title', 'instructorId'],
      },
      {
        model: User,
        as: 'user',
        required: true,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!enrollment) {
    throw new HttpError(404, 'Student enrollment not found', 'ENROLLMENT_NOT_FOUND');
  }

  const plain = enrollment.toJSON();
  if (
    currentUser.role !== 'admin'
    && Number(plain.course?.instructorId) !== Number(currentUser.id)
  ) {
    throw new HttpError(403, 'You are not the instructor', 'FORBIDDEN');
  }

  const created = await TeacherInteraction.create({
    teacherId: currentUser.id,
    type: 'qa',
    userName: plain.user?.name || plain.user?.email || 'Hoc vien',
    context: plain.course?.title || 'Khoa hoc',
    content: `${DIRECT_MESSAGE_PREFIX} ${payload.message}`,
    rating: null,
    reply: '',
  });

  return normalizeDirectMessage(created);
};

module.exports = {
  getInteractions,
  replyInteraction,
  sendStudentMessage,
};
