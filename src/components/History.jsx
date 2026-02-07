import { useState, useEffect } from 'react';
import { workoutLogger } from '../lib/workoutLogger';
import './History.css';

function History() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workoutLogger.fetchWorkoutHistory(20);
      setWorkouts(data);
    } catch (err) {
      console.error('Failed to load workout history:', err);
      setError('Failed to load workout history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="history-loading">Loading workout history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="history-error">{error}</div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="history-container">
        <div className="history-empty">
          <div className="history-empty-icon">💪</div>
          <h2>No workouts yet</h2>
          <p>Complete your first workout to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-list">
        {workouts.map((workout) => (
          <div key={workout.id} className="workout-log-card">
            <div className="workout-log-header">
              <span className="workout-log-date">
                {formatDate(workout.completed_at)}
              </span>
            </div>
            <div className="workout-log-exercises">
              {workout.exercises.map((exercise, idx) => (
                <div key={idx} className="workout-log-exercise">
                  <div className="workout-log-exercise-name">{exercise.name}</div>
                  <div className="workout-log-sets">
                    {exercise.sets.map((set, setIdx) => (
                      <span key={setIdx} className="workout-log-set">
                        {set.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
