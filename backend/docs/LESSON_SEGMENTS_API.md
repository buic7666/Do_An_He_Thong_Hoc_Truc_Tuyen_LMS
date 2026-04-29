# Lesson Segments API Documentation

## Overview
Lesson Segments are used to divide a long lesson video into smaller, manageable sections with specific start and end times. This allows teachers to organize YouTube videos into meaningful chunks and helps students navigate to specific topics more easily.

## Database Schema

### `lesson_segments` Table
```sql
CREATE TABLE lesson_segments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  lesson_id BIGINT UNSIGNED NOT NULL,
  start_time INT UNSIGNED NOT NULL,  -- in seconds
  end_time INT UNSIGNED NOT NULL,    -- in seconds
  duration INT UNSIGNED NOT NULL,    -- end_time - start_time
  title VARCHAR(255),                -- optional segment title
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. Create a Lesson Segment
**POST** `/api/lessons/:lessonId/segments`

#### Request Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body
```json
{
  "startTime": 0,
  "endTime": 300,
  "title": "Introduction"
}
```

#### Response
```json
{
  "success": true,
  "message": "Segment created",
  "data": {
    "id": 1,
    "lessonId": 5,
    "startTime": 0,
    "endTime": 300,
    "duration": 300,
    "title": "Introduction",
    "createdAt": "2026-04-29T08:00:00.000Z",
    "updatedAt": "2026-04-29T08:00:00.000Z"
  },
  "statusCode": 201
}
```

### 2. Get All Segments for a Lesson
**GET** `/api/lessons/:lessonId/segments`

#### Request Headers
```
Authorization: Bearer {token}
```

#### Response
```json
{
  "success": true,
  "message": "Segments retrieved",
  "data": [
    {
      "id": 1,
      "lessonId": 5,
      "startTime": 0,
      "endTime": 300,
      "duration": 300,
      "title": "Introduction",
      "createdAt": "2026-04-29T08:00:00.000Z",
      "updatedAt": "2026-04-29T08:00:00.000Z"
    },
    {
      "id": 2,
      "lessonId": 5,
      "startTime": 300,
      "endTime": 600,
      "duration": 300,
      "title": "Main Content",
      "createdAt": "2026-04-29T08:01:00.000Z",
      "updatedAt": "2026-04-29T08:01:00.000Z"
    }
  ],
  "statusCode": 200
}
```

### 3. Delete a Lesson Segment
**DELETE** `/api/lessons/segments/:segmentId`

#### Request Headers
```
Authorization: Bearer {token}
```

#### Response
```json
{
  "success": true,
  "message": "Segment deleted",
  "data": {
    "id": 1,
    "deleted": true
  },
  "statusCode": 200
}
```

## Frontend Integration

### Using the Lesson Segment Manager Component
```jsx
import LessonSegmentManager from './components/LessonSegmentManager';

function MyComponent() {
  const [showSegmentManager, setShowSegmentManager] = useState(false);
  const lessonId = 5; // example lesson ID

  return (
    <div>
      <button onClick={() => setShowSegmentManager(true)}>
        Manage Segments
      </button>
      
      {showSegmentManager && (
        <LessonSegmentManager 
          lessonId={lessonId}
          onClose={() => setShowSegmentManager(false)}
        />
      )}
    </div>
  );
}
```

### Using the API Client
```jsx
import {
  getSegmentsByLesson,
  createSegment,
  deleteSegment
} from './api/lessonSegmentApi';

// Get segments
const response = await getSegmentsByLesson(lessonId);
if (response.success) {
  console.log(response.data); // array of segments
}

// Create segment
const createResponse = await createSegment(lessonId, {
  startTime: 0,
  endTime: 300,
  title: 'Introduction'
});

// Delete segment
const deleteResponse = await deleteSegment(segmentId);
```

## Validation Rules

1. **startTime & endTime**: Must be positive integers (seconds)
2. **endTime > startTime**: End time must be greater than start time
3. **title**: Optional, max 255 characters
4. **lessonId**: Must reference an existing lesson

## Time Format
All times are stored and transmitted in **seconds**. 

### Example conversions:
- 300 seconds = 5 minutes
- 3600 seconds = 1 hour
- 3900 seconds = 1 hour 5 minutes

### Helper function to format time:
```javascript
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

formatTime(300);  // "00:05:00"
formatTime(3661); // "01:01:01"
```

## Database Setup

### Running Migration
```bash
npm run seed:lesson-segments
```

This command will:
1. Create the `lesson_segments` table if it doesn't exist
2. Seed sample data (40 segments across 10 lessons)

## Files Created/Modified

### New Files
- `backend/src/models/lecture.model.js` - LessonSegment model (refactored)
- `backend/src/controllers/lessonSegmentController.js` - API handlers
- `backend/src/services/lessonSegmentService.js` - Business logic
- `backend/src/scripts/seedLessonSegments.js` - Migration/seed script
- `backend/seeds/migration_lesson_segments.sql` - Migration SQL
- `backend/seeds/seed_lesson_segments.sql` - Seed data SQL
- `frontend/src/components/LessonSegmentManager.jsx` - React component
- `frontend/src/components/LessonSegmentManager.css` - Component styles
- `frontend/src/api/lessonSegmentApi.js` - API client

### Modified Files
- `backend/src/models/index.js` - Added LessonSegment import, associations, export
- `backend/src/routes/lessonRoutes.js` - Added segment routes
- `backend/src/validations/lessonValidation.js` - Added segment validation schemas
- `backend/package.json` - Added npm script for seeding
- `backend/server.js` - Added LessonSegment sync on startup

## Error Handling

### Common Errors

**400 Bad Request** - Invalid input
```json
{
  "success": false,
  "message": "Invalid startTime/endTime",
  "error": "INVALID_TIMES"
}
```

**403 Forbidden** - User doesn't own the lesson (TODO: implement permission checks)
```json
{
  "success": false,
  "message": "Question not found or you do not have permission",
  "error": "FORBIDDEN"
}
```

**404 Not Found** - Resource doesn't exist
```json
{
  "success": false,
  "message": "Lesson not found",
  "error": "LESSON_NOT_FOUND"
}
```

## Future Enhancements

1. **Update segment** - Add PATCH/PUT endpoint to modify segments
2. **Permissions** - Add proper authorization checks to ensure only lesson owner can manage segments
3. **Bulk operations** - Add endpoints to bulk create/delete segments
4. **Segment preview** - Add iframe embed to preview segment video
5. **Keyboard navigation** - Add keyboard shortcuts for time selection
6. **Drag-and-drop** - Allow reordering segments by dragging
