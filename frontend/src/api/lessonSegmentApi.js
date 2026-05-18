/**
 * Lesson Segment API Client
 * Handles all API calls for lesson segment management
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Get all segments for a lesson
 */
export const getSegmentsByLesson = async (lessonId) => {
  try {
    const response = await fetch(`${API_URL}/lessons/${lessonId}/segments`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching segments:', error);
    throw error;
  }
};

/**
 * Create a new segment for a lesson
 */
export const createSegment = async (lessonId, segmentData) => {
  try {
    const response = await fetch(`${API_URL}/lessons/${lessonId}/segments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(segmentData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating segment:', error);
    throw error;
  }
};

/**
 * Delete a segment
 */
export const deleteSegment = async (segmentId) => {
  try {
    const response = await fetch(`${API_URL}/lessons/segments/${segmentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting segment:', error);
    throw error;
  }
};

/**
 * Update segment (for future use)
 */
export const updateSegment = async (segmentId, segmentData) => {
  try {
    const response = await fetch(`${API_URL}/lessons/segments/${segmentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(segmentData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating segment:', error);
    throw error;
  }
};

export default {
  getSegmentsByLesson,
  createSegment,
  deleteSegment,
  updateSegment,
};
