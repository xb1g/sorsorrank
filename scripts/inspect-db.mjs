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
  const remoteUrl = `https://${env.SUPABASE_PROJECT_REF}.supabase.co/rest/v1/politicians?party_label=eq.เพื่อไทย`;
  const res = await fetch(remoteUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  const data = await res.json();
  console.log(`Found ${data.length} PTP politicians.`);
  console.log(data.slice(0, 5));
}

main();
