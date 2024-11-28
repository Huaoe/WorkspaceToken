import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  try {
    // Fetch all property requests that need updating
    const { data: properties, error: fetchError } = await supabase
      .from('property_requests')
      .select('id, title')
      .is('token_name', null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${properties?.length || 0} properties to update`);

    // Update each property
    for (const property of properties || []) {
      const tokenName = `${property.title} Token`;
      const tokenSymbol = property.title
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 5);

      const { error: updateError } = await supabase
        .from('property_requests')
        .update({
          token_name: tokenName,
          token_symbol: tokenSymbol,
        })
        .eq('id', property.id);

      if (updateError) {
        console.error(`Failed to update property ${property.id}:`, updateError);
      } else {
        console.log(`Updated property ${property.id} with token name: ${tokenName}, symbol: ${tokenSymbol}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
