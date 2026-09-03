import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDirectory = path.resolve(process.cwd(), "data");

fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "plex-rewind.db");

export const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

db.pragma("journal_mode = WAL");

console.log(`Database: ${databasePath}`);
