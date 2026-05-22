import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.supabase.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

// Determine supabase URL
// We can use the project ref to hit the local or remote DB. 
// If local is running on 54321, let's try that first, else fallback to remote.
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("No Supabase key found.");
  process.exit(1);
}

// Helper to fetch JSON from PostgREST
async function pgFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase request failed: ${res.status} ${text}`);
  }
  // 204 No Content for UPDATES if return=minimal
  if (res.status === 204) return null;
  return res.json();
}

async function getPTPPoliticians() {
  const url = `${SUPABASE_URL}/rest/v1/politicians?select=id,display_name,party_label&party_label=eq.เพื่อไทย`;
  let politicians;
  try {
    politicians = await pgFetch(url);
  } catch (e) {
    console.log("Failed connecting to local Supabase, trying remote...", e.message);
    const remoteUrl = `https://${env.SUPABASE_PROJECT_REF}.supabase.co/rest/v1/politicians?select=id,display_name,party_label&party_label=eq.เพื่อไทย`;
    politicians = await pgFetch(remoteUrl);
  }
  return politicians;
}

async function updatePoliticianImage(id, imageUrl, sourceUrl) {
  const url = `${SUPABASE_URL}/rest/v1/politicians?id=eq.${id}`;
  try {
    await pgFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({
        image_url: imageUrl,
        image_source_url: sourceUrl
      })
    });
  } catch (e) {
    const remoteUrl = `https://${env.SUPABASE_PROJECT_REF}.supabase.co/rest/v1/politicians?id=eq.${id}`;
    await pgFetch(remoteUrl, {
      method: 'PATCH',
      body: JSON.stringify({
        image_url: imageUrl,
        image_source_url: sourceUrl
      })
    });
  }
}

async function scrapePtpImage(displayName) {
  // Parse name assuming it might have a title separated by space: "นาย รุ่งเพชร ศรีกาญจนา"
  // or no title: "รุ่งเพชร ศรีกาญจนา"
  let parts = displayName.split(' ').filter(Boolean);
  let title = '';
  let firstName = '';
  let lastName = '';

  const commonTitles = ['นาย', 'นาง', 'นางสาว', 'น.ส.', 'ร.ต.อ.', 'พ.ต.อ.', 'พล.ต.อ.', 'ดร.', 'นพ.', 'พญ.'];
  
  if (commonTitles.includes(parts[0])) {
    title = parts[0];
    firstName = parts[1];
    lastName = parts.slice(2).join('-');
  } else {
    // If title is combined like "นายรุ่งเพชร"
    for (const t of commonTitles) {
      if (parts[0].startsWith(t)) {
        title = t;
        firstName = parts[0].substring(t.length);
        lastName = parts.slice(1).join('-');
        break;
      }
    }
    // If still no title found
    if (!title) {
      firstName = parts[0];
      lastName = parts.slice(1).join('-');
    }
  }

  // PTP URL format often includes the title. e.g. "นาย-เลิศศักดิ์-พัฒนชัยกุล"
  const generateSlugs = (t, f, l) => {
    // if title is present, prepend it, else try common ones
    let titlesToTry = t ? [t] : ['นาย', 'นาง', 'นางสาว', ''];
    let slugs = [];
    for (const prefix of titlesToTry) {
      let base = prefix ? `${prefix}-${f}-${l}` : `${f}-${l}`;
      slugs.push(
        base,
        base.substring(0, base.length - 1), // Truncate 1 char
        base.substring(0, base.length - 2),
        base.substring(0, base.length - 3)
      );
    }
    return slugs;
  };

  const allSlugs = generateSlugs(title, firstName, lastName);

  for (const slug of allSlugs) {
    const encodedSlug = encodeURIComponent(slug);
    const targetUrl = `https://www.ptp.or.th/archives/people/${encodedSlug}`;
    
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const html = await res.text();
        // Look for og:image
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (ogImageMatch && ogImageMatch[1]) {
          return {
            imageUrl: ogImageMatch[1],
            sourceUrl: targetUrl
          };
        }
      }
    } catch (e) {
      // ignore fetch errors for bad guesses
    }
  }

  return null;
}

async function main() {
  console.log("Fetching PTP politicians from Supabase...");
  const politicians = await getPTPPoliticians();
  console.log(`Found ${politicians.length} PTP politicians.`);

  let successCount = 0;

  for (const pol of politicians) {
    console.log(`\nScraping image for: ${pol.display_name}...`);
    const result = await scrapePtpImage(pol.display_name);
    
    if (result) {
      console.log(`✅ Found image: ${result.imageUrl}`);
      await updatePoliticianImage(pol.id, result.imageUrl, result.sourceUrl);
      console.log(`   Updated database for ${pol.display_name}`);
      successCount++;
    } else {
      console.log(`❌ No image found on ptp.or.th for ${pol.display_name}`);
    }

    // Small delay to be polite to the server
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Successfully updated ${successCount}/${politicians.length} politicians.`);
}

main().catch(console.error);
