const { Course, Enrollment, User } = require('../models');
const { HttpError } = require('../utils/httpError');

const monthFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: '2-digit',
  year: 'numeric',
});

const normalizeAmount = (value) => Number(value || 0);

const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getLastSixMonths = () => {
  const months = [];
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const pointer = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: getMonthKey(pointer),
      label: monthFormatter.format(pointer),
    });
  }

  return months;
};

const getDashboardOverview = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const courses = await Course.findAll({
    where: {
      instructorId: currentUser.id,
    },
    attributes: ['id', 'title', 'price', 'instructorId', 'createdAt'],
    include: [
      {
        model: Enrollment,
        as: 'enrollments',
        required: false,
        attributes: ['id', 'userId', 'courseId', 'status', 'createdAt'],
        include: [
          {
            model: User,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'email'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const allEnrollments = [];

  courses.forEach((course) => {
    const coursePlain = course.toJSON();
    const coursePrice = normalizeAmount(coursePlain.price);

    (coursePlain.enrollments || []).forEach((enrollment) => {
      allEnrollments.push({
        id: enrollment.id,
        userId: enrollment.userId,
        status: enrollment.status,
        createdAt: enrollment.createdAt,
        course: {
          id: coursePlain.id,
          title: coursePlain.title,
          price: coursePrice,
        },
        user: enrollment.user
          ? {
              id: enrollment.user.id,
              name: enrollment.user.name,
              email: enrollment.user.email,
            }
          : null,
      });
    });
  });

  const activeEnrollments = allEnrollments.filter((item) => item.status === 'active');
  const activeStudentIds = new Set(activeEnrollments.map((item) => item.userId));

  const now = new Date();
  const startOfCurrentMonth = getStartOfMonth(now);

  const totalRevenueCurrentMonth = activeEnrollments.reduce((sum, enrollment) => {
    const createdAt = new Date(enrollment.createdAt);
    if (createdAt >= startOfCurrentMonth) {
      return sum + normalizeAmount(enrollment.course.price);
    }
    return sum;
  }, 0);

  const monthSeriesSeed = getLastSixMonths();
  const monthTotals = monthSeriesSeed.reduce((accumulator, month) => {
    accumulator[month.key] = 0;
    return accumulator;
  }, {});

  activeEnrollments.forEach((enrollment) => {
    const key = getMonthKey(new Date(enrollment.createdAt));
    if (Object.prototype.hasOwnProperty.call(monthTotals, key)) {
      monthTotals[key] += normalizeAmount(enrollment.course.price);
    }
  });

  const monthlyRevenue = monthSeriesSeed.map((month) => ({
    label: month.label,
    amount: monthTotals[month.key],
  }));

  const recentEnrollments = [...activeEnrollments]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 8)
    .map((enrollment) => ({
      id: enrollment.id,
      studentName: enrollment.user?.name || 'Hoc vien',
      studentEmail: enrollment.user?.email || '',
      courseName: enrollment.course.title,
      createdAt: enrollment.createdAt,
    }));

  const enrollments = activeEnrollments.map((enrollment) => ({
    id: enrollment.id,
    userId: enrollment.userId,
    studentName: enrollment.user?.name || 'Hoc vien',
    studentEmail: enrollment.user?.email || '',
    courseId: enrollment.course.id,
    courseName: enrollment.course.title,
    price: enrollment.course.price,
    createdAt: enrollment.createdAt,
  }));

  return {
    stats: {
      totalRevenueCurrentMonth,
      totalStudents: activeStudentIds.size,
      activeCourses: courses.length,
      averageRating: 0,
    },
    monthlyRevenue,
    recentEnrollments,
    enrollments,
    courses: courses.map((course) => {
      const plain = course.toJSON();
      const activeCount = (plain.enrollments || []).filter((item) => item.status === 'active').length;

      return {
        id: plain.id,
        title: plain.title,
        price: normalizeAmount(plain.price),
        totalStudents: activeCount,
        createdAt: plain.createdAt,
      };
    }),
  };
};

module.exports = {
  getDashboardOverview,
};
