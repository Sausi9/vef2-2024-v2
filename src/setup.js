import { readFile } from 'fs/promises';
import { query } from './lib/db.js';

async function dropTable() {
  const data = await readFile('./src/sql/drop.sql');
  await query(data.toString('utf-8'));
}

async function schema() {
  const data = await readFile('./src/sql/schema.sql');
  await query(data.toString('utf-8'));
}

async function insertData() {
  const data = await readFile('./src/sql/insert.sql');
  await query(data.toString('utf-8'));
}

async function setup() {
  await dropTable();
  await schema();
  await insertData();
}

// drop schema insert
// lest inn skrána schema, readfile
// insert query(data.toString('utf-8'))

async function main() {
  setup();
}

main().catch((e) => console.error(e));
