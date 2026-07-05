const { User, Course, Lesson, Enrollment, Chapter, Quiz } = require('../models');
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
      attributes: ['id', 'title', 'createdAt', 'status'],
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
    return course.status === 'pending';
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


const getUsers = async () => {
  return await User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  user.role = role;
  await user.save();
  return user;
};

const updateUserStatus = async (userId, status) => {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  user.status = status;
  await user.save();
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  await user.destroy();
  return { message: "User deleted successfully" };
};

const getPendingCourses = async () => {
  const courses = await Course.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Chapter,
        as: 'chapters',
        required: false,
        include: [
          {
            model: Lesson,
            as: 'lessons',
            required: false,
            attributes: ['id']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return courses.map(course => {
    const plain = course.toJSON();

    const syllabus = (plain.chapters || []).map(chapter => {
      const lessonCount = Array.isArray(chapter.lessons) ? chapter.lessons.length : 0;
      return {
        title: chapter.title,
        lessons: ` Bài giảng`
      };
    });

    if (syllabus.length === 0 && Array.isArray(plain.lessons) && plain.lessons.length > 0) {
       syllabus.push({ title: 'Chưa có chương', lessons: ` Bài giảng` });
    }

    return {
      id: plain.id,
      title: plain.title,
      instructor: plain.instructor ? plain.instructor.name : 'Unknown',
      submittedDate: new Date(plain.createdAt).toLocaleDateString('vi-VN'),
      proposedPrice: plain.price ? `đ` : 'Miễn phí',
      description: plain.description || 'Không có mô tả',
      syllabus: syllabus
    };
  });
};

const updateCourseStatus = async (courseId, status, reason) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');

  if (!['approved', 'rejected'].includes(status)) {
    throw new HttpError(400, 'Invalid status', 'INVALID_STATUS');
  }

  course.status = status;
  course.approvalStatus = status === 'approved' ? 'APPROVED' : 'REJECTED';
  course.isPublished = status === 'approved';
  // TODO: send reason to instructor if rejected
  await course.save();

  await Lesson.update(
    {
      approvalStatus: status === 'approved' ? 'APPROVED' : 'REJECTED',
      status,
      isPublished: status === 'approved',
    },
    { where: { courseId } },
  );

  await Quiz.update(
    { isPublished: status === 'approved' },
    { where: { courseId, ...(status === 'approved' ? { lessonId: null } : {}) } },
  );

  return { id: course.id, status: course.status };
};

module.exports = {
  deleteUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getDashboardOverview,
  getPendingCourses,
  updateCourseStatus,
};
