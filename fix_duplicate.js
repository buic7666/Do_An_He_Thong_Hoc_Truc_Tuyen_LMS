const fs = require('fs');
const file = 'frontend/src/screens/Admin/AdminCourseManagement.jsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const startIdx = lines.findIndex(l => l.includes('// Xử lý Phê duyệt / Từ chối Bài học cụ thể'));
if (startIdx !== -1) {
    const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('// Xóa khóa học'));
    if (endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx);
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        console.log('Removed duplicate handleApproveLesson from lines ' + startIdx + ' to ' + (endIdx - 1));
    }
}
