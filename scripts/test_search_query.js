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

const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const remoteUrl = `https://${env.SUPABASE_PROJECT_REF}.supabase.co/rest/v1/politicians?select=display_name,role_label,party_label,search_query&limit=5`;
  const res = await fetch(remoteUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  data.forEach(p => {
    let remainder = p.search_query || '';
    if (p.display_name) remainder = remainder.replace(p.display_name, '');
    if (p.role_label) remainder = remainder.replace(p.role_label, '');
    if (p.party_label) remainder = remainder.replace(p.party_label, '');
    // Also remove hardcoded "สมาชิกสภาผู้แทนราษฎร" if it's there
    remainder = remainder.replace('สมาชิกสภาผู้แทนราษฎร', '');
    remainder = remainder.trim();
    console.log(`Original: ${p.search_query}`);
    console.log(`Role Label: ${p.role_label}`);
    console.log(`Extracted Province/Remainder: '${remainder}'`);
    console.log('---');
  });
}
main();
