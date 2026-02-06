import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  projects,
  epics,
  tasks,
  comments,
  dependencies,
  idCounters,
  events,
} from "./schema";

// Re-export schema
export { projects, epics, tasks, comments, dependencies, idCounters, events };

const schema = { projects, epics, tasks, comments, dependencies, idCounters, events };

// Infer types from schema
export type Project = typeof projects.$inferSelect;
export type Epic = typeof epics.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Dependency = typeof dependencies.$inferSelect;
export type IdCounter = typeof idCounters.$inferSelect;

let sqliteInstance: Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get database connection
 * 
 * In multi-project mode (when projects are configured), this returns
 * the currently active connection from DatabaseManager.
 * 
 * In single-project mode (legacy), falls back to TREKKER_DB_PATH.
 */
export function getDb() {
  // Check if we're in multi-project mode
  // This will be set by middleware or can be manually called
  const { dbManager } = require("./database-manager.js");
  const currentDb = dbManager.getCurrentConnection();
  
  if (currentDb) {
    return currentDb;
  }

  // Fall back to legacy single-project mode
  if (db) return db;

  const dbPath = process.env.TREKKER_DB_PATH;
  if (!dbPath) {
    throw new Error("TREKKER_DB_PATH environment variable not set");
  }

  sqliteInstance = new Database(dbPath);
  db = drizzle(sqliteInstance, { schema });
  return db;
}

export function getSqliteInstance() {
  if (!sqliteInstance) {
    getDb(); // Initialize if not already
  }
  return sqliteInstance;
}
