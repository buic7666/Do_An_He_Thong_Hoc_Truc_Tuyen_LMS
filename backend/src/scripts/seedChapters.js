/**
 * Seed data for chapters and lesson segments
 * Usage: npm run seed:chapters
 */

const { sequelize, Chapter, Course, Lesson, LessonSegment, User } = require('../models');

const seedChapters = async () => {
  try {
    console.log('🌱 Seeding chapters...');

    // Get instructor and lesson data
    const teacher = await User.findOne({ where: { role: 'teacher' } });
    const course = await Course.findOne({ where: { instructorId: teacher?.id } });
    const lesson = await Lesson.findOne({ where: { courseId: course?.id } });

    if (!teacher || !course || !lesson) {
      console.log('⚠️  No teacher/course/lesson found. Skipping chapter seed.');
      return;
    }

    // Create chapters
    const chapters = await Chapter.bulkCreate([
      {
        courseId: course.id,
        title: 'Chương 1: Kiến Thức Cơ Bản',
        description: 'Giới thiệu những khái niệm cơ bản của lập trình',
        orderIndex: 1,
      },
      {
        courseId: course.id,
        title: 'Chương 2: Biến và Kiểu Dữ Liệu',
        description: 'Tìm hiểu về biến, kiểu dữ liệu và cách sử dụng chúng',
        orderIndex: 2,
      },
      {
        courseId: course.id,
        title: 'Chương 3: Vòng Lặp và Điều Kiện',
        description: 'Học cách sử dụng if-else, for, while loops',
        orderIndex: 3,
      },
    ]);

    console.log(`✅ Created ${chapters.length} chapters`);

    // Update lesson to belong to chapter
    if (lesson && chapters[0]) {
      lesson.chapterId = chapters[0].id;
      await lesson.save();
      console.log('✅ Updated lesson with chapter');
    }

    // Create lesson segments for the lesson
    const segments = await LessonSegment.bulkCreate([
      {
        lessonId: lesson.id,
        startTime: 0,
        endTime: 300,
        duration: 300,
        title: 'Phần 1: Giới thiệu',
      },
      {
        lessonId: lesson.id,
        startTime: 300,
        endTime: 600,
        duration: 300,
        title: 'Phần 2: Ví dụ cơ bản',
      },
      {
        lessonId: lesson.id,
        startTime: 600,
        endTime: 900,
        duration: 300,
        title: 'Phần 3: Bài tập',
      },
    ]);

    console.log(`✅ Created ${segments.length} lesson segments`);

    console.log('✅ Chapter seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding chapters:', error.message);
    throw error;
  }
};

// Run seed if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedChapters();
      await sequelize.close();
      console.log('✅ Seed completed and connection closed');
    } catch (error) {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = seedChapters;
