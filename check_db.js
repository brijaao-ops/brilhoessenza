import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    // If table is empty, this might be [], but if it has data we will see keys.
    // To get actual columns even if empty, we could try to cause an error or query pg_class (which is blocked by REST).
    if (data && data.length > 0) {
      console.log("Columns in products:", Object.keys(data[0]));
    } else {
      console.log("No data returned, cannot reliably guess columns via select *");
    }
  }
}
main();
