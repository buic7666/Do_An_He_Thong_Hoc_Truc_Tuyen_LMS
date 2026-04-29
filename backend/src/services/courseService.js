const courseRepository = require('../repositories/courseRepository');
const { HttpError } = require('../utils/httpError');

const parseId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }

  return id;
};

const getAllCourses = async () => {
  const courses = await courseRepository.findAll();

  return courses.map((item) => {
    const plain = item.toJSON();

    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      price: Number(plain.price || 0),
      instructor: plain.instructor
        ? {
            id: plain.instructor.id,
            name: plain.instructor.name,
            email: plain.instructor.email,
          }
        : null,
      lessonsCount: Array.isArray(plain.lessons) ? plain.lessons.length : 0,
      totalStudents: Array.isArray(plain.enrollments)
        ? plain.enrollments.filter((enrollment) => enrollment.status === 'active').length
        : 0,
      createdAt: plain.createdAt,
    };
  });
};

const getCourseDetail = async (courseId) => {
  const parsedCourseId = parseId(courseId, 'courseId');
  const course = await courseRepository.findByIdWithLessons(parsedCourseId);

  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  const plain = course.toJSON();

  // Fetch chapters for this course
  const Chapter = require('../models/chapter.model');
  const chapters = await Chapter.findAll({
    where: { courseId: parsedCourseId },
    raw: true,
    order: [['orderIndex', 'ASC']],
  });

  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    price: Number(plain.price || 0),
    instructor: plain.instructor
      ? {
          id: plain.instructor.id,
          name: plain.instructor.name,
          email: plain.instructor.email,
        }
      : null,
    chapters: Array.isArray(chapters)
      ? chapters.map((chapter) => ({
          id: chapter.id,
          courseId: chapter.courseId,
          title: chapter.title,
          description: chapter.description,
          orderIndex: chapter.orderIndex,
        }))
      : [],
    lessons: Array.isArray(plain.lessons)
      ? plain.lessons.map((lesson) => ({
          id: lesson.id,
          courseId: lesson.courseId,
          chapterId: lesson.chapterId,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          content: lesson.content,
          orderIndex: lesson.orderIndex,
          createdAt: lesson.createdAt,
        }))
      : [],
    stats: {
      totalLessons: Array.isArray(plain.lessons) ? plain.lessons.length : 0,
      totalStudents: Array.isArray(plain.enrollments)
        ? plain.enrollments.filter((enrollment) => enrollment.status === 'active').length
        : 0,
    },
    createdAt: plain.createdAt,
  };
};

const getLessonsByCourse = async (courseId) => {
  const parsedCourseId = parseId(courseId, 'courseId');
  const course = await courseRepository.findById(parsedCourseId);

  if (!course) {
    throw new HttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  }

  const lessons = await courseRepository.findLessonsByCourseId(parsedCourseId);

  return lessons.map((lesson) => {
    const plain = lesson.toJSON();
    return {
      id: plain.id,
      courseId: plain.courseId,
      title: plain.title,
      videoUrl: plain.videoUrl,
      content: plain.content,
      orderIndex: plain.orderIndex,
      createdAt: plain.createdAt,
    };
  });
};

const createCourse = async (payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const instructorId = currentUser.role === 'admin' && payload.instructorId ? payload.instructorId : currentUser.id;

  const created = await courseRepository.createCourse({
    title: payload.title,
    description: payload.description || '',
    price: payload.price || 0,
    instructorId,
  });

  const plain = created.toJSON();

  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    price: Number(plain.price || 0),
    instructorId: plain.instructorId,
    createdAt: plain.createdAt,
  };
};

module.exports = {
  getAllCourses,
  getCourseDetail,
  getLessonsByCourse,
  createCourse,
};