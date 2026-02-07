import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dapcrfsbpynvlhrtkrfa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_EMAIL = process.env.USER_EMAIL || 'george.cains@gmail.com';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Get the service role key from: Supabase Dashboard > Settings > API');
  console.error('\nUsage:');
  console.error('  export SUPABASE_SERVICE_KEY=your-service-role-key');
  console.error('  node scripts/bulk-upload.js scripts/exercises.json');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function bulkUploadExercises(filePath) {
  console.log('📁 Reading exercises from:', filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Read input file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let exercises;

  try {
    exercises = JSON.parse(fileContent);
  } catch (err) {
    console.error('❌ Error: Invalid JSON format');
    console.error(err.message);
    process.exit(1);
  }

  // Validate exercise format
  if (!Array.isArray(exercises)) {
    console.error('❌ Error: JSON must be an array of exercises');
    process.exit(1);
  }

  for (const exercise of exercises) {
    if (!exercise.name || !Array.isArray(exercise.sets)) {
      console.error('❌ Error: Each exercise must have "name" and "sets" (array of numbers)');
      console.error('Example: {"name": "Exercise Name", "sets": [10, 10, 10]}');
      process.exit(1);
    }
  }

  console.log(`✅ Found ${exercises.length} exercises to upload\n`);

  // Get user by email
  console.log(`🔍 Looking up user: ${USER_EMAIL}`);
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error fetching users:', userError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === USER_EMAIL);

  if (!user) {
    console.error(`❌ Error: User not found with email: ${USER_EMAIL}`);
    console.error('Make sure the user has signed in to the app at least once.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email} (${user.id})\n`);

  // Delete existing templates
  console.log('🗑️  Clearing existing templates...');
  const { error: deleteError } = await supabase
    .from('exercise_templates')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('❌ Error deleting existing templates:', deleteError.message);
    process.exit(1);
  }

  console.log('✅ Existing templates cleared\n');

  // Insert new templates
  console.log('📤 Uploading new templates...');
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    const { data: template, error: templateError } = await supabase
      .from('exercise_templates')
      .insert({
        user_id: user.id,
        name: exercise.name,
        sort_order: i
      })
      .select()
      .single();

    if (templateError) {
      console.error(`❌ Error inserting template "${exercise.name}":`, templateError.message);
      process.exit(1);
    }

    console.log(`  ✓ ${exercise.name}`);

    // Insert sets
    const sets = exercise.sets.map((reps, idx) => ({
      exercise_template_id: template.id,
      default_reps: reps,
      sort_order: idx
    }));

    const { error: setsError } = await supabase
      .from('template_sets')
      .insert(sets);

    if (setsError) {
      console.error(`❌ Error inserting sets for "${exercise.name}":`, setsError.message);
      process.exit(1);
    }

    console.log(`    → ${exercise.sets.length} sets: ${exercise.sets.join(', ')} reps`);
  }

  console.log('\n✅ Upload complete!');
  console.log('📱 Open the app to see your new exercise template.\n');
}

// CLI usage
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('❌ Error: No input file specified\n');
  console.error('Usage:');
  console.error('  node scripts/bulk-upload.js <input-file>\n');
  console.error('Example:');
  console.error('  export SUPABASE_SERVICE_KEY=your-service-role-key');
  console.error('  node scripts/bulk-upload.js scripts/exercises-example.json\n');
  console.error('The input file should be a JSON array of exercises:');
  console.error('  [');
  console.error('    {"name": "Exercise 1", "sets": [10, 10, 10]},');
  console.error('    {"name": "Exercise 2", "sets": [12, 12]}');
  console.error('  ]');
  process.exit(1);
}

bulkUploadExercises(inputFile).catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
