/**
 * One-time seed script: reads ~500k rows from sample-tick-data.csv.zip,
 * streams and decompresses line-by-line (low memory footprint), and bulk-inserts
 * into the tick_data table in batches.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... ts-node --project tsconfig.scripts.json \
 *     deployment/postgres/scripts/import-tick-data.ts
 *
 * Or via npm script:
 *   DATABASE_URL=postgresql://... npm run import:tick-data
 */

import 'dotenv/config';
import * as path from 'path';
import { Client } from 'pg';
import { parse } from 'csv-parse';
import * as unzipper from 'unzipper';

const ZIP_PATH = path.join(__dirname, 'sample-tick-data.csv.zip');
const BATCH_SIZE = 1_000;

type CsvRow = Record<string, string>;
type JsonRecord = Record<string, string | null>;

function toJsonRecord(raw: CsvRow): JsonRecord {
  const now = new Date().toISOString();
  const record: JsonRecord = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = key.toLowerCase();
    if (k === 'pricing_date') {
      if (value === '') {
        record[k] = null;
      } else {
        const d = new Date(value);
        if (isNaN(d.getTime())) throw new Error(`Invalid pricing_date: "${value}"`);
        record[k] = d.toISOString().slice(0, 10);
      }
    } else {
      record[k] = value === '' ? null : value;
    }
  }
  record.created_at = now;
  record.updated_at = now;
  return record;
}

async function insertBatch(client: Client, batch: JsonRecord[]): Promise<void> {
  const placeholders = batch.map((_, i) => `($${i + 1})`).join(', ');
  const params = batch.map((r) => JSON.stringify(r));
  await client.query(`INSERT INTO tick_data (data) VALUES ${placeholders}`, params);
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  const directory = await unzipper.Open.file(ZIP_PATH);
  const csvEntry = directory.files.find((f) => f.path.endsWith('.csv'));

  if (!csvEntry) {
    throw new Error(`No CSV file found inside ${ZIP_PATH}`);
  }

  const parser = csvEntry
    .stream()
    .pipe(parse({ columns: true, cast: false, trim: true, skip_empty_lines: true }));

  let batch: JsonRecord[] = [];
  let total = 0;

  for await (const raw of parser as AsyncIterable<CsvRow>) {
    batch.push(toJsonRecord(raw));

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(client, batch);
      total += batch.length;
      process.stdout.write(`\rInserted ${total.toLocaleString()} rows...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(client, batch);
    total += batch.length;
  }

  console.log(`\nDone. Total rows inserted: ${total.toLocaleString()}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
