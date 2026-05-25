import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Simple .env parser
function loadEnv() {
  const envPaths = [path.resolve('.env'), path.resolve('.env.supabase.local')];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log('Reading:', envPath);
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          console.log(`Parsed key: ${key}`);
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_REF ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co` : 'http://127.0.0.1:54321');
// Use service role key if available, otherwise anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", !!supabaseUrl);
console.log("Supabase Key:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchWikipedia(query, lang = 'th') {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|info&inprop=url&pithumbsize=800&format=json&gsrlimit=1`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SorsorRankBot/1.0 (https://sorsorrank.com; your@email.com)'
      }
    });
    const data = await res.json();
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages);
      if (pages.length > 0) {
        const page = pages[0];
        if (page.thumbnail && page.thumbnail.source) {
          return {
            imageUrl: page.thumbnail.source,
            sourceUrl: page.fullurl || `https://${lang}.wikipedia.org/wiki/?curid=${page.pageid}`
          };
        }
      }
    }
  } catch (e) {
    console.error(`Error searching Wikipedia for ${query}:`, e.message);
  }
  return null;
}

async function main() {
  const BATCH_SIZE = parseInt(process.argv[2]) || 5; // allow passing batch size as argument
  console.log(`Starting to fetch images for politicians (Limit: ${BATCH_SIZE})`);
  
  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('id, display_name, search_query')
    .is('image_url', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Error fetching politicians:", error);
    process.exit(1);
  }

  console.log(`Found ${politicians.length} politicians missing images in this batch.`);
  
  let updatedCount = 0;

  for (const pol of politicians) {
    const thQuery = pol.display_name;
    const enQuery = (pol.search_query || pol.display_name).replace(/ Thailand$/i, '');
    console.log(`Searching for TH: ${thQuery}, EN: ${enQuery}`);
    
    // Try TH Wikipedia using display_name (usually in Thai)
    let result = await searchWikipedia(thQuery, 'th');
    
    // Try EN Wikipedia if not found using English search query
    if (!result) {
      result = await searchWikipedia(enQuery, 'en');
    }
    
    // fallback to English search query on TH Wikipedia
    if (!result) {
      result = await searchWikipedia(enQuery, 'th');
    }

    if (result) {
      console.log(`  Found image: ${result.imageUrl}`);
      const { error: updateError } = await supabase
        .from('politicians')
        .update({
          image_url: result.imageUrl,
          image_source_url: result.sourceUrl
        })
        .eq('id', pol.id);
        
      if (updateError) {
        console.error(`  Error updating ${pol.display_name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`  No image found on Wikipedia.`);
    }
    
    // small delay to be polite to Wikipedia API
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nFinished! Successfully updated images for ${updatedCount} politicians out of ${politicians.length}.`);
}

main().catch(console.error);
