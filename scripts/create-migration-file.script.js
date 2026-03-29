#!/usr/bin/env node
// Deprecated: Use `supabase migration new your_description_here` instead
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input
const input = process.argv[2];

if (!input) {
  console.log("❌ Please provide a short description");
  console.log("Usage: pnpm run create-migration-file add_users_table");
  process.exit(1);
}

// snake_case
const description = input
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

// Timestamp
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14);

// File name
const fileName = `${timestamp}_${description}.sql`;

// Target path
const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

// Ensure dir exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const filePath = path.join(migrationsDir, fileName);

// Content
const content = `-- Migration: ${description}
-- Created at: ${timestamp}

BEGIN;

-- Write your SQL here

COMMIT;
`;

fs.writeFileSync(filePath, content);

console.log(`✅ Migration created: ${filePath}`);