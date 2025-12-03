import { exit } from 'node:process';
import { supabase } from '../src/libs/supabase.js';

const run = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('Supabase query failed:', error);
      exit(1);
    }

    console.log('Supabase connection OK. Sample row:', data?.[0] ?? null);
    exit(0);
  } catch (error) {
    console.error('Unexpected error while checking Supabase:', error);
    exit(1);
  }
};

void run();
