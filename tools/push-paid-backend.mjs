#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const tokens = process.argv.slice(2);
const args = {};
for (let index = 0; index < tokens.length; index += 1) {
  if (!tokens[index].startsWith('--')) continue;
  const key = tokens[index].slice(2);
  args[key] = tokens[index + 1] && !tokens[index + 1].startsWith('--') ? tokens[++index] : 'true';
}

const source = path.resolve(args.file || '.secure-backend/paid-case-payloads.json');
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !serviceRoleKey) throw new Error('Нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
if (!fs.existsSync(source)) throw new Error(`Не найден secure export: ${source}`);

const bundle = JSON.parse(fs.readFileSync(source, 'utf8'));
if (bundle.totalCases !== 85 || !Array.isArray(bundle.items) || bundle.items.length !== 85) {
  throw new Error('Secure export должен содержать ровно 85 платных дел');
}

const endpoint = `${supabaseUrl}/rest/v1/paid_case_payloads?on_conflict=case_id`;
for (let offset = 0; offset < bundle.items.length; offset += 20) {
  const batch = bundle.items.slice(offset, offset + 20);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });
  if (!response.ok) throw new Error(`Supabase upsert ${response.status}: ${await response.text()}`);
  console.log(`Uploaded ${Math.min(offset + batch.length, bundle.items.length)} / ${bundle.items.length}`);
}

console.log(JSON.stringify({ uploaded: bundle.items.length, productId: bundle.productId }, null, 2));
