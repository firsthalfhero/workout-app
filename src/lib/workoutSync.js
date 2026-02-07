import { supabase } from './supabase';

const STORAGE_KEY = 'workout-exercises';
const LAST_SYNC_KEY = 'last-sync-timestamp';

class WorkoutSync {
  constructor() {
    this.syncInProgress = false;
  }

  // Load exercises with offline-first approach
  async loadExercises() {
    // Load from localStorage first for instant display
    const localData = this.getLocalExercises();

    // Attempt background sync if online and authenticated
    if (navigator.onLine && await this.isAuthenticated()) {
      this.syncFromSupabase().catch(err => {
        console.warn('Background sync failed:', err);
      });
    }

    return localData;
  }

  // Get exercises from localStorage
  getLocalExercises() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [{
      name: 'Sample Exercise',
      sets: [{ reps: 10 }]
    }];
  }

  // Save exercises with optimistic update
  async saveExercises(exercises) {
    // Immediate local save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));

    // Background sync to Supabase
    if (navigator.onLine && await this.isAuthenticated()) {
      return this.syncToSupabase(exercises).catch(err => {
        console.warn('Failed to sync to Supabase:', err);
        throw err;
      });
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Sync from Supabase to local
  async syncFromSupabase() {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch exercise templates with sets
      const { data: templates, error } = await supabase
        .from('exercise_templates')
        .select(`
          id,
          name,
          sort_order,
          updated_at,
          template_sets (
            id,
            default_reps,
            sort_order
          )
        `)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (templates && templates.length > 0) {
        // Transform to app format
        const exercises = templates.map(template => ({
          id: template.id,
          name: template.name,
          sets: template.template_sets
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(set => ({ reps: set.default_reps, id: set.id }))
        }));

        // Check if remote is newer
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        const remoteUpdated = templates.some(t =>
          new Date(t.updated_at) > new Date(lastSync || 0)
        );

        if (remoteUpdated || !lastSync) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
          localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync from local to Supabase
  async syncToSupabase(exercises) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get existing templates to compare
    const { data: existingTemplates } = await supabase
      .from('exercise_templates')
      .select('id, name, sort_order')
      .eq('user_id', user.id);

    const existingMap = new Map(
      (existingTemplates || []).map(t => [t.name, t])
    );

    // Upsert templates
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const existing = existingMap.get(exercise.name);

      let templateId;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('exercise_templates')
          .update({
            name: exercise.name,
            sort_order: i,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
        existingMap.delete(exercise.name);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('exercise_templates')
          .insert({
            user_id: user.id,
            name: exercise.name,
            sort_order: i
          })
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
      }

      // Delete existing sets for this template
      const { error: deleteError } = await supabase
        .from('template_sets')
        .delete()
        .eq('exercise_template_id', templateId);

      if (deleteError) throw deleteError;

      // Insert new sets
      const sets = exercise.sets.map((set, idx) => ({
        exercise_template_id: templateId,
        default_reps: set.reps,
        sort_order: idx
      }));

      const { error: setsError } = await supabase
        .from('template_sets')
        .insert(sets);

      if (setsError) throw setsError;
    }

    // Delete templates no longer in local list
    for (const [name, template] of existingMap) {
      await supabase
        .from('exercise_templates')
        .delete()
        .eq('id', template.id);
    }

    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }
}

export const workoutSync = new WorkoutSync();
