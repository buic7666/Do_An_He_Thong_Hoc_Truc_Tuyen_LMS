const { User, Course, Lesson, Enrollment } = require('../models');
const { HttpError } = require('../utils/httpError');

const monthFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: '2-digit',
  year: 'numeric',
});

const normalizeAmount = (value) => Number(value || 0);

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

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

  const [totalTeachers, totalStudents, totalAdmins, allCourses, activeEnrollments] = await Promise.all([
    User.count({ where: { role: 'teacher' } }),
    User.count({ where: { role: 'student' } }),
    User.count({ where: { role: 'admin' } }),
    Course.findAll({
      attributes: ['id', 'title', 'createdAt'],
      include: [
        {
          model: Lesson,
          as: 'lessons',
          required: false,
          attributes: ['id'],
        },
      ],
    }),
    Enrollment.findAll({
      where: { status: 'active' },
      attributes: ['id', 'createdAt'],
      include: [
        {
          model: Course,
          as: 'course',
          required: false,
          attributes: ['id', 'title', 'price'],
        },
      ],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  const totalPendingCourses = allCourses.filter((course) => {
    const plain = course.toJSON();
    return !Array.isArray(plain.lessons) || plain.lessons.length === 0;
  }).length;

  const startOfCurrentMonth = getStartOfMonth(new Date());
  const totalRevenueCurrentMonth = activeEnrollments.reduce((sum, enrollment) => {
    const createdAt = new Date(enrollment.createdAt);
    if (createdAt >= startOfCurrentMonth) {
      return sum + normalizeAmount(enrollment.course?.price);
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
      monthTotals[key] += normalizeAmount(enrollment.course?.price);
    }
  });

  const monthlyRevenue = monthSeriesSeed.map((month) => ({
    label: month.label,
    amount: monthTotals[month.key],
  }));

  return {
    stats: {
      totalRevenueCurrentMonth,
      totalTeachers,
      totalStudents,
      totalPendingCourses,
    },
    monthlyRevenue,
    userDistribution: {
      teachers: totalTeachers,
      students: totalStudents,
      admins: totalAdmins,
    },
  };
};

module.exports = {
  getDashboardOverview,
};
