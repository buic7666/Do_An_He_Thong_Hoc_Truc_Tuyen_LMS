const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Course, Enrollment } = require('../models');

const STUDENT_SEED_COUNT = 8;
const COURSE_PER_INSTRUCTOR = 2;

const getSeedDateInMonth = (monthOffset, day = 10) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthOffset, day, 9, 0, 0);
};

const ensureStudents = async () => {
  const passwordHash = await bcrypt.hash('12345678', 10);
  const students = [];

  for (let index = 1; index <= STUDENT_SEED_COUNT; index += 1) {
    const [student] = await User.findOrCreate({
      where: { email: `student.seed${index}@lms.local` },
      defaults: {
        name: `Hoc vien mau ${index}`,
        email: `student.seed${index}@lms.local`,
        passwordHash,
        role: 'student',
      },
    });

    students.push(student);
  }

  return students;
};

const ensureInstructors = async () => {
  const instructors = await User.findAll({
    where: {
      role: {
        [Op.in]: ['teacher', 'admin'],
      },
    },
  });

  if (instructors.length > 0) {
    return instructors;
  }

  const passwordHash = await bcrypt.hash('12345678', 10);
  const teacher = await User.create({
    name: 'Giang vien seed',
    email: 'teacher.seed@lms.local',
    passwordHash,
    role: 'teacher',
  });

  return [teacher];
};

const ensureCoursesForInstructor = async (instructor) => {
  const courses = [];

  for (let index = 1; index <= COURSE_PER_INSTRUCTOR; index += 1) {
    const title = `[SEED] ${instructor.name} - Khoa hoc ${index}`;
    const [course] = await Course.findOrCreate({
      where: {
        instructorId: instructor.id,
        title,
      },
      defaults: {
        title,
        description: `Du lieu mau dashboard cho ${instructor.name}`,
        price: 299000 + index * 100000,
        instructorId: instructor.id,
      },
    });

    courses.push(course);
  }

  return courses;
};

const createMonthlyEnrollments = async (courses, students) => {
  const createdRecords = [];

  for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
    const course = courses[monthOffset % courses.length];
    const student = students[monthOffset % students.length];
    const createdAt = getSeedDateInMonth(monthOffset, 10 + monthOffset);
    const enrollment = await Enrollment.create({
      userId: student.id,
      courseId: course.id,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });

    createdRecords.push(enrollment);
  }

  return createdRecords;
};

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const students = await ensureStudents();
    const instructors = await ensureInstructors();

    let totalCoursesTouched = 0;
    let totalEnrollmentsCreated = 0;

    for (const instructor of instructors) {
      const courses = await ensureCoursesForInstructor(instructor);
      totalCoursesTouched += courses.length;

      const enrollments = await createMonthlyEnrollments(courses, students);
      totalEnrollmentsCreated += enrollments.length;
    }

    // eslint-disable-next-line no-console
    console.log(`Seed done: instructors=${instructors.length}, courses=${totalCoursesTouched}, enrollments_added=${totalEnrollmentsCreated}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seed teacher dashboard failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

run();
