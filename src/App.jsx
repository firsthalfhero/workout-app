import { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import './App.css';

const STORAGE_KEY = 'workout-exercises';
const EMAIL_TARGET = 'george.cains@gmail.com';

function App() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [submitStatus, setSubmitStatus] = useState('');

  // Load exercises from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setExercises(JSON.parse(saved));
    } else {
      // Default exercise template
      setExercises([{
        name: 'Sample Exercise',
        sets: [{ reps: 10 }]
      }]);
    }
  }, []);

  // Save exercises to localStorage
  const saveExercises = (newExercises) => {
    setExercises(newExercises);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newExercises));
  };

  // Format workout data for email
  const formatWorkoutData = (values) => {
    const date = new Date().toLocaleString();
    let text = `Workout completed on ${date}\n\n`;

    values.exercises.forEach((exercise, idx) => {
      text += `${idx + 1}. ${exercise.name}\n`;
      exercise.sets.forEach((set, setIdx) => {
        text += `   Set ${setIdx + 1}: ${set.reps} reps\n`;
      });
      text += '\n';
    });

    return text;
  };

  // Send email using mailto (simple, no backend needed)
  const handleSubmit = (values, { resetForm }) => {
    const emailBody = formatWorkoutData(values);
    const subject = `Workout Log - ${new Date().toLocaleDateString()}`;

    const mailtoLink = `mailto:${EMAIL_TARGET}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;

    setSubmitStatus('Email opened! Send it to complete.');
    setTimeout(() => setSubmitStatus(''), 3000);

    // Reset form to original template
    resetForm();
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
        <h1>💪 Workout Tracker</h1>
        <button
          className="mode-toggle"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? '✓ Save Template' : '⚙️ Edit'}
        </button>
      </header>

      {submitStatus && (
        <div className="status-message">{submitStatus}</div>
      )}

      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={isEditMode ?
          (values) => {
            saveExercises(values.exercises);
            setIsEditMode(false);
          } :
          handleSubmit
        }
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

            <button type="submit" className="btn-submit">
              {isEditMode ? '💾 Save Template' : '📧 Send Workout'}
            </button>
          </Form>
        )}
      </Formik>

      <footer className="footer">
        <small>Tap Edit to modify exercises • Tap Send to email workout</small>
      </footer>
    </div>
  );
}

export default App;
