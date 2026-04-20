import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[FAIL] Missing env vars. Check .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[FAIL]', error.message);
    process.exit(1);
  }

  if (data.session !== null) {
    console.error('[FAIL] Expected null session, got:', data.session);
    process.exit(1);
  }

  console.log('[OK] Supabase connected. Session is null as expected.');
  process.exit(0);
})();
