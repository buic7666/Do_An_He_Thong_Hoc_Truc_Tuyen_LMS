import { useState, useEffect } from 'react';
import './LessonSegmentManager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonSegmentManager = ({ lessonId, onClose }) => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    title: '',
  });

  useEffect(() => {
    fetchSegments();
  }, [lessonId]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lessons/${lessonId}/segments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSegments(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch segments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'title' ? value : parseInt(value) || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startTime || !formData.endTime) {
      setError('Start time and end time are required');
      return;
    }

    if (formData.endTime <= formData.startTime) {
      setError('End time must be greater than start time');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lessons/${lessonId}/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ startTime: '', endTime: '', title: '' });
        setError('');
        fetchSegments();
      } else {
        setError(data.message || 'Failed to create segment');
      }
    } catch (err) {
      setError('Error creating segment');
      console.error(err);
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/lessons/segments/${segmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchSegments();
      } else {
        setError(data.message || 'Failed to delete segment');
      }
    } catch (err) {
      setError('Error deleting segment');
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lesson-segment-manager">
      <div className="segment-modal-header">
        <h2>Manage Lesson Segments</h2>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="segment-form">
        <h3>Add New Segment</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Start Time (seconds)</label>
            <input
              type="number"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              min="0"
              placeholder="0"
              required
            />
          </div>

          <div className="form-group">
            <label>End Time (seconds)</label>
            <input
              type="number"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              min="1"
              placeholder="300"
              required
            />
          </div>

          <div className="form-group">
            <label>Title (Optional)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Introduction"
              maxLength="255"
            />
          </div>

          <button type="submit" className="btn-submit">
            Add Segment
          </button>
        </form>
      </div>

      <div className="segments-list">
        <h3>Current Segments ({segments.length})</h3>
        {loading ? (
          <p>Loading...</p>
        ) : segments.length === 0 ? (
          <p className="no-segments">No segments yet. Create one above.</p>
        ) : (
          <div className="segments-table">
            {segments.map((segment) => (
              <div key={segment.id} className="segment-item">
                <div className="segment-info">
                  <div className="segment-title">
                    {segment.title || `Segment ${segment.id}`}
                  </div>
                  <div className="segment-time">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    <span className="duration">
                      ({formatTime(segment.duration)})
                    </span>
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteSegment(segment.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonSegmentManager;
