const { TeacherInteraction, Enrollment, User, Course } = require('../models');
const { HttpError } = require('../utils/httpError');

const normalizeInteraction = (item) => {
  const plain = item.toJSON();

  return {
    id: plain.id,
    type: plain.type,
    userName: plain.userName,
    context: plain.context,
    content: plain.content,
    rating: plain.rating,
    reply: plain.reply || '',
    createdAt: plain.createdAt,
  };
};

const seedInteractions = async (teacherId) => {
  const total = await TeacherInteraction.count({ where: { teacherId } });
  if (total > 0) {
    return;
  }

  const enrollments = await Enrollment.findAll({
    include: [
      {
        model: Course,
        as: 'course',
        required: true,
        where: { instructorId: teacherId },
        attributes: ['title'],
      },
      {
        model: User,
        as: 'user',
        required: false,
        attributes: ['name'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  if (enrollments.length === 0) {
    return;
  }

  const payload = [];

  enrollments.forEach((item, index) => {
    const plain = item.toJSON();
    const studentName = plain.user?.name || 'Hoc vien';
    const courseTitle = plain.course?.title || 'Khoa hoc';

    payload.push({
      teacherId,
      type: 'qa',
      userName: studentName,
      context: courseTitle,
      content: `Em can giai thich them ve bai hoc trong khoa ${courseTitle}.`,
      rating: null,
      reply: '',
    });

    if (index < 2) {
      payload.push({
        teacherId,
        type: 'review',
        userName: studentName,
        context: courseTitle,
        content: `Noi dung khoa ${courseTitle} rat huu ich va de theo doi.`,
        rating: 5,
        reply: '',
      });
    }
  });

  await TeacherInteraction.bulkCreate(payload);
};

const getInteractions = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  await seedInteractions(currentUser.id);

  const rows = await TeacherInteraction.findAll({
    where: { teacherId: currentUser.id },
    order: [['createdAt', 'DESC']],
  });

  const normalized = rows.map(normalizeInteraction);

  return {
    qaThreads: normalized.filter((item) => item.type === 'qa'),
    reviews: normalized.filter((item) => item.type === 'review'),
  };
};

const replyInteraction = async (id, payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const row = await TeacherInteraction.findOne({
    where: {
      id,
      teacherId: currentUser.id,
    },
  });

  if (!row) {
    throw new HttpError(404, 'Interaction not found', 'INTERACTION_NOT_FOUND');
  }

  row.reply = payload.reply || '';
  await row.save();

  return normalizeInteraction(row);
};

module.exports = {
  getInteractions,
  replyInteraction,
};
