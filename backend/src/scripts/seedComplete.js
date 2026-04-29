/**
 * Complete seed script to test all new features
 * Creates: teacher, course, lessons with segments, questions, quiz
 */

const { sequelize } = require('../config/database');
const models = require('../models');

const seedAll = async () => {
  try {
    console.log('🌱 Starting complete seed...\n');

    // 1. Create teacher user
    console.log('1️⃣  Creating teacher user...');
    const teacher = await models.User.findOrCreate({
      where: { email: 'teacher@test.com' },
      defaults: {
        name: 'Test Teacher',
        email: 'teacher@test.com',
        passwordHash: '$2b$10$6sYEsL/vX4C/fz7/OZYqJeYqNNGj8cH/WzfqAjc7vCrB5z5BmpYH2', // bcrypt of 'password123'
        role: 'teacher'
      }
    });
    console.log(`✅ Teacher created: ${teacher[0].email}\n`);

    // 2. Create student users
    console.log('2️⃣  Creating student users...');
    const students = [];
    for (let i = 1; i <= 2; i++) {
      const [student] = await models.User.findOrCreate({
        where: { email: `student${i}@test.com` },
        defaults: {
          name: `Student ${i}`,
          email: `student${i}@test.com`,
          passwordHash: '$2b$10$6sYEsL/vX4C/fz7/OZYqJeYqNNGj8cH/WzfqAjc7vCrB5z5BmpYH2',
          role: 'student'
        }
      });
      students.push(student);
    }
    console.log(`✅ ${students.length} students created\n`);

    // 3. Create course
    console.log('3️⃣  Creating course...');
    const [course] = await models.Course.findOrCreate({
      where: { title: 'Web Development Fundamentals' },
      defaults: {
        title: 'Web Development Fundamentals',
        description: 'Learn web development from scratch',
        instructorId: teacher[0].id,
        price: 0
      }
    });
    console.log(`✅ Course created: ${course.title}\n`);

    // 4. Create chapters
    console.log('4️⃣  Creating chapters...');
    const chapters = [];
    for (let i = 1; i <= 2; i++) {
      const chapter = await models.Chapter.findOrCreate({
        where: { 
          courseId: course.id,
          title: `Chapter ${i}: Introduction to Module ${i}`
        },
        defaults: {
          courseId: course.id,
          title: `Chapter ${i}: Introduction to Module ${i}`,
          description: `Learn the basics of module ${i}`,
          orderIndex: i - 1
        }
      });
      chapters.push(chapter[0]);
    }
    console.log(`✅ ${chapters.length} chapters created\n`);

    // 5. Create lessons with video URLs
    console.log('5️⃣  Creating lessons...');
    const lessons = [];
    const videoUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=jNQXAC9IVRw'
    ];

    // Determine a safe starting orderIndex to avoid unique constraint collisions
    const existingMaxOrder = await models.Lesson.max('orderIndex', { where: { courseId: course.id } });
    const startIndex = Number.isFinite(existingMaxOrder) ? existingMaxOrder + 1 : 1;

    for (let i = 0; i < videoUrls.length; i++) {
      const desiredOrder = startIndex + i;
      const lesson = await models.Lesson.findOrCreate({
        where: {
          courseId: course.id,
          title: `Lesson ${i + 1}`
        },
        defaults: {
          courseId: course.id,
          chapterId: chapters[i].id,
          title: `Lesson ${i + 1}: Video Lecture ${i + 1}`,
          videoUrl: videoUrls[i],
          content: `Content for lesson ${i + 1}`,
          orderIndex: desiredOrder
        }
      });
      lessons.push(lesson[0]);
    }
    console.log(`✅ ${lessons.length} lessons created\n`);

    // 6. Create lesson segments (video timestamps)
    console.log('6️⃣  Creating lesson segments...');
    const segments = [];
    for (const lesson of lessons) {
      const segment = await models.LessonSegment.findOrCreate({
        where: {
          lessonId: lesson.id,
          title: `${lesson.title} - Part 1`
        },
        defaults: {
          lessonId: lesson.id,
          startTime: 0,
          endTime: 300,
          duration: 300,
          title: `${lesson.title} - Part 1`
        }
      });
      segments.push(segment[0]);
    }
    console.log(`✅ ${segments.length} lesson segments created\n`);

    // 7. Create questions
    console.log('7️⃣  Creating questions...');
    const questions = [];
    const questionData = [
      {
        content: 'What is HTML?',
        options: ['Markup Language', 'Programming Language', 'Database', 'Framework'],
        correctIndex: 0,
        difficulty: 'EASY',
        lectureId: lessons[0].id
      },
      {
        content: 'Which tag is used for the largest heading?',
        options: ['<h6>', '<h1>', '<heading>', '<title>'],
        correctIndex: 1,
        difficulty: 'EASY',
        lectureId: lessons[0].id
      },
      {
        content: 'What does CSS stand for?',
        options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets', 'Creative Style Sheets'],
        correctIndex: 0,
        difficulty: 'MEDIUM',
        lectureId: lessons[1].id
      }
    ];

    for (const q of questionData) {
      const question = await models.Question.findOrCreate({
        where: {
          content: q.content,
          createdBy: teacher[0].id
        },
        defaults: {
          content: q.content,
          type: 'MULTIPLE_CHOICE',
          difficulty: q.difficulty,
          metadata: {
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: `The correct answer is ${q.options[q.correctIndex]}`
          },
          createdBy: teacher[0].id,
          lectureId: q.lectureId
        }
      });
      questions.push(question[0]);
    }
    console.log(`✅ ${questions.length} questions created\n`);

    // 8. Create quizzes for each chapter
    console.log('8️⃣  Creating quizzes...');
    const quizzes = [];
    for (const chapter of chapters) {
      const quiz = await models.Quiz.findOrCreate({
        where: {
          courseId: course.id,
          chapterId: chapter.id,
          title: `${chapter.title} - Quiz`
        },
        defaults: {
          courseId: course.id,
          chapterId: chapter.id,
          title: `${chapter.title} - Quiz`,
          description: `Assessment for ${chapter.title}`,
          duration: 1800,
          passScore: 70,
          maxAttempts: 3,
          isPublished: false,
          createdBy: teacher[0].id
        }
      });
      quizzes.push(quiz[0]);
    }
    console.log(`✅ ${quizzes.length} quizzes created\n`);

    // 9. Add questions to quizzes
    console.log('9️⃣  Adding questions to quizzes...');
    if (quizzes.length > 0 && questions.length > 0) {
      // Add first 2 questions to first quiz
      await quizzes[0].addQuestions([questions[0], questions[1]]);
      // Add last question to second quiz
      if (quizzes[1]) {
        await quizzes[1].addQuestions([questions[2]]);
      }
      console.log('✅ Questions added to quizzes\n');
    }

    // 10. Enroll students in course
    console.log('🔟 Enrolling students in course...');
    for (const student of students) {
      await models.Enrollment.findOrCreate({
        where: {
          userId: student.id,
          courseId: course.id
        },
        defaults: {
          userId: student.id,
          courseId: course.id,
          status: 'active'
        }
      });
    }
    console.log(`✅ ${students.length} students enrolled\n`);

    console.log('✅✅✅ Complete seed successful! ✅✅✅\n');
    console.log('📊 Summary:');
    console.log(`   - Teacher: ${teacher[0].email}`);
    console.log(`   - Students: ${students.map(s => s.email).join(', ')}`);
    console.log(`   - Course: ${course.title}`);
    console.log(`   - Chapters: ${chapters.length}`);
    console.log(`   - Lessons: ${lessons.length}`);
    console.log(`   - Segments: ${segments.length}`);
    console.log(`   - Questions: ${questions.length}`);
    console.log(`   - Quizzes: ${quizzes.length}\n`);
    console.log('🚀 Ready to test API endpoints!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

// Run seed if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedAll();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = seedAll;
