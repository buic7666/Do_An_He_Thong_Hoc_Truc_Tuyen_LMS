const { Lesson, Course } = require('./backend/src/models');
async function test() {
   const lesson = await Lesson.findOne({ raw: true });
   console.log('Lesson:', lesson ? Object.keys(lesson) : 'None');
   const course = await Course.findOne({ raw: true });
   console.log('Course:', course ? Object.keys(course) : 'None');
   process.exit(0);
}
test();
