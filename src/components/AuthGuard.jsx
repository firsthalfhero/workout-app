import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { workoutSync } from '../lib/workoutSync';
import './AuthGuard.css';

function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [authStatus, setAuthStatus] = useState('');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Check for migration on first auth
      if (session && !localStorage.getItem('migration-complete')) {
        checkAndMigrateLocalData();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAndMigrateLocalData = async () => {
    const localExercises = localStorage.getItem('workout-exercises');

    if (localExercises) {
      const shouldMigrate = window.confirm(
        'We found your existing workout template. Would you like to sync it to the cloud?'
      );

      if (shouldMigrate) {
        try {
          await workoutSync.syncToSupabase(JSON.parse(localExercises));
          localStorage.setItem('migration-complete', 'true');
          alert('Your workout template has been synced!');
        } catch (err) {
          console.error('Migration failed:', err);
          alert('Failed to sync template. You can try again from settings.');
        }
      } else {
        localStorage.setItem('migration-complete', 'true');
      }
    } else {
      localStorage.setItem('migration-complete', 'true');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthStatus('Sending magic link...');

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setAuthStatus(`Error: ${error.message}`);
    } else {
      setAuthStatus('Check your email for the login link!');
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>💪 Workout Tracker</h1>
          <p>Sign in to sync your workouts across devices</p>

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
            <button type="submit" className="auth-button">
              Send Magic Link
            </button>
          </form>

          {authStatus && (
            <div className="auth-status">{authStatus}</div>
          )}

          <footer className="auth-footer">
            <small>No password needed • Secure email login</small>
          </footer>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
