import { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import { workoutSync } from './lib/workoutSync';
import { workoutLogger } from './lib/workoutLogger';
import { supabase } from './lib/supabase';
import History from './components/History';
import './App.css';

function App() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const [successMessage, setSuccessMessage] = useState('');

  // Load exercises on mount with Supabase sync
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedExercises = await workoutSync.loadExercises();
        setExercises(loadedExercises);
      } catch (err) {
        console.error('Error loading exercises:', err);
        // Fallback to localStorage only
        const saved = localStorage.getItem('workout-exercises');
        if (saved) {
          setExercises(JSON.parse(saved));
        } else {
          setExercises([{
            name: 'Sample Exercise',
            sets: [{ reps: 10 }]
          }]);
        }
      }
    };

    loadData();

    // Sync when app comes into focus
    const handleFocus = () => {
      loadData().then(() => {
        setSyncStatus('Synced');
        setTimeout(() => setSyncStatus(''), 2000);
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Save exercises with Supabase sync
  const saveExercises = async (newExercises) => {
    setExercises(newExercises);
    try {
      await workoutSync.saveExercises(newExercises);
      setSyncStatus('Saved & synced');
      setTimeout(() => setSyncStatus(''), 2000);
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('Saved locally');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (confirmed) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  // Handle complete workout
  const handleCompleteWorkout = async (values) => {
    try {
      const exercises = values.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: s.reps }))
      }));

      await workoutLogger.logWorkout(exercises);

      setSuccessMessage('Workout saved! 💪');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Switch to History tab to show the completed workout
      setActiveTab('history');
    } catch (err) {
      console.error('Failed to log workout:', err);
      alert('Failed to save workout. Please try again.');
    }
  };

  // Initial values for Formik
  const initialValues = {
    exercises: exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.map(s => ({ reps: s.reps }))
    }))
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>💪 Workout Tracker</h1>
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              Live
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
        </div>
        <div className="header-actions">
          {syncStatus && <span className="sync-status">{syncStatus}</span>}
          <button
            className="logout-button"
            onClick={handleLogout}
            title="Sign out"
          >
            🚪
          </button>
          {activeTab === 'live' && (
            <button
              className="mode-toggle"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? '✓ Save Template' : '⚙️ Edit'}
            </button>
          )}
        </div>
      </header>

      {successMessage && (
        <div className="status-message">{successMessage}</div>
      )}

      {activeTab === 'live' ? (
        <Formik
          enableReinitialize
          initialValues={initialValues}
          onSubmit={(values) => {
            saveExercises(values.exercises);
            setIsEditMode(false);
          }}
        >
          {({ values }) => (
            <Form className="workout-form">
              <FieldArray name="exercises">
                {({ push: pushExercise, remove: removeExercise }) => (
                  <div className="exercises-container">
                    {values.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="exercise-card">
                        {isEditMode ? (
                          <>
                            <div className="exercise-header">
                              <Field
                                name={`exercises.${exIdx}.name`}
                                as="textarea"
                                maxLength={100}
                                placeholder="Exercise name"
                                className="exercise-name-input"
                                rows="2"
                              />
                              {values.exercises.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-exercise"
                                  onClick={() => removeExercise(exIdx)}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <h3 className="exercise-name">{exercise.name}</h3>
                        )}

                        <FieldArray name={`exercises.${exIdx}.sets`}>
                          {({ push: pushSet, remove: removeSet }) => (
                            <div className="sets-container">
                              {exercise.sets.map((set, setIdx) => (
                                <div key={setIdx} className="set-row">
                                  <label className="set-label">Set {setIdx + 1}</label>
                                  <Field
                                    name={`exercises.${exIdx}.sets.${setIdx}.reps`}
                                    type="number"
                                    min="1"
                                    className="reps-input"
                                    placeholder="Reps"
                                  />
                                  {isEditMode && exercise.sets.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn-remove-set"
                                      onClick={() => removeSet(setIdx)}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}

                              {isEditMode && exercise.sets.length < 5 && (
                                <button
                                  type="button"
                                  className="btn-add-set"
                                  onClick={() => pushSet({ reps: 10 })}
                                >
                                  + Add Set
                                </button>
                              )}
                            </div>
                          )}
                        </FieldArray>
                      </div>
                    ))}

                    {isEditMode && (
                      <button
                        type="button"
                        className="btn-add-exercise"
                        onClick={() => pushExercise({
                          name: 'New Exercise',
                          sets: [{ reps: 10 }]
                        })}
                      >
                        + Add Exercise
                      </button>
                    )}
                  </div>
                )}
              </FieldArray>

              {isEditMode ? (
                <button type="submit" className="btn-submit">
                  💾 Save Template
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => handleCompleteWorkout(values)}
                >
                  ✓ Complete Workout
                </button>
              )}
            </Form>
          )}
        </Formik>
      ) : (
        <History />
      )}

      {activeTab === 'live' && (
        <footer className="footer">
          <small>Tap Edit to modify exercises and sync across devices</small>
        </footer>
      )}
    </div>
  );
}

export default App;
