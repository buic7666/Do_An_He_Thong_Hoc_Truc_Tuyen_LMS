/**
 * Script: Fix Chapter Assignment for Lessons
 * 
 * Tạo chapters cho các courses và gán chapterId cho các lessons
 * Giúp fix vấn đề các bài học chưa có chapter_id
 */

const { sequelize } = require('../config/database');
const { Course, Lesson, Chapter } = require('../models');

const fixChapterAssignment = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Lấy tất cả courses
    const courses = await Course.findAll();
    console.log(`\n📚 Found ${courses.length} courses`);

    for (const course of courses) {
      console.log(`\n🔄 Processing course: "${course.title}" (ID: ${course.id})`);

      // Lấy tất cả lessons của course
      const lessons = await Lesson.findAll({
        where: { courseId: course.id },
        order: [['orderIndex', 'ASC']],
      });

      if (lessons.length === 0) {
        console.log('   ℹ️  No lessons found for this course');
        continue;
      }

      console.log(`   📖 Found ${lessons.length} lessons`);

      // Tính số chương dựa vào số bài (chia thành 3-4 bài mỗi chương)
      const lessonsPerChapter = Math.ceil(lessons.length / 2); // Chia thành 2 chương
      const chaptersNeeded = Math.ceil(lessons.length / lessonsPerChapter);

      console.log(`   📊 Creating ${chaptersNeeded} chapters (~${lessonsPerChapter} lessons each)`);

      // Tạo chapters
      const createdChapters = [];
      for (let i = 0; i < chaptersNeeded; i += 1) {
        const chapter = await Chapter.findOrCreate({
          where: {
            courseId: course.id,
            title: `Chương ${i + 1}`,
          },
          defaults: {
            courseId: course.id,
            title: `Chương ${i + 1}`,
            description: `Chương ${i + 1} của khóa học "${course.title}"`,
            orderIndex: i + 1,
          },
        });

        createdChapters.push(chapter[0]);
        console.log(`      ✅ Chapter "${chapter[0].title}" (ID: ${chapter[0].id})`);
      }

      // Gán lessons vào chapters
      for (let i = 0; i < lessons.length; i += 1) {
        const lesson = lessons[i];
        const chapterIndex = Math.floor(i / lessonsPerChapter);
        const targetChapter = createdChapters[chapterIndex];

        if (!lesson.chapterId) {
          await lesson.update({ chapterId: targetChapter.id });
          console.log(`      📌 Lesson "${lesson.title}" → Chapter ${targetChapter.id}`);
        } else {
          console.log(`      ℹ️  Lesson "${lesson.title}" already has chapterId: ${lesson.chapterId}`);
        }
      }
    }

    console.log('\n✅ Fix chapter assignment completed!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing chapter assignment:', error);
    await sequelize.close();
    process.exit(1);
  }
};

fixChapterAssignment();
