import { supabase } from './supabase';

class WorkoutLogger {
  // Log a completed workout
  async logWorkout(exercises) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        exercises: exercises,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fetch workout history (last N workouts)
  async fetchWorkoutHistory(limit = 20) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Delete a workout log
  async deleteWorkout(id) {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const workoutLogger = new WorkoutLogger();
