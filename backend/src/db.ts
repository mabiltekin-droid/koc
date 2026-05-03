import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'database.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS banks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    apiEndpoint TEXT,
    authType TEXT
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    bankId TEXT NOT NULL,
    text TEXT NOT NULL,
    answer TEXT,
    solutionSteps TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    difficulty TEXT,
    FOREIGN KEY (bankId) REFERENCES banks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    questionId TEXT NOT NULL,
    userAnswer TEXT,
    correct INTEGER,
    timestamp TEXT,
    feedback TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gap_profiles (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    topic TEXT NOT NULL,
    masteryScore REAL DEFAULT 0,
    lastPracticed TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS practice_items (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    topic TEXT NOT NULL,
    prompt TEXT NOT NULL,
    expectedSolution TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`)

export default db
