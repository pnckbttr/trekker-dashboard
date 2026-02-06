import { drizzle, BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./db.js";
import { getProject } from "../config/loader.js";

interface DatabaseConnection {
  projectId: string;
  db: BunSQLiteDatabase<typeof schema>;
  sqliteDb: Database;
  lastAccessed: number;
}

class DatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private currentProjectId: string | null = null;
  private maxConnections = 10;
  private connectionTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get database connection for a specific project
   */
  getConnection(projectId: string): BunSQLiteDatabase<typeof schema> {
    // Check if connection exists and is valid
    let connection = this.connections.get(projectId);

    if (connection) {
      connection.lastAccessed = Date.now();
      this.currentProjectId = projectId;
      return connection.db;
    }

    // Need to create new connection
    const project = getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Check connection limit
    if (this.connections.size >= this.maxConnections) {
      this.cleanupOldConnections();
    }

    // Create new connection
    console.log(`[DatabaseManager] Creating connection for project: ${projectId}`);
    const sqliteDb = new Database(project.dbPath);
    const db = drizzle(sqliteDb, { schema });

    connection = {
      projectId,
      db,
      sqliteDb,
      lastAccessed: Date.now(),
    };

    this.connections.set(projectId, connection);
    this.currentProjectId = projectId;

    return db;
  }

  /**
   * Get the currently active database connection
   */
  getCurrentConnection(): BunSQLiteDatabase<typeof schema> | null {
    if (!this.currentProjectId) {
      return null;
    }
    return this.getConnection(this.currentProjectId);
  }

  /**
   * Switch to a different project
   */
  switchProject(projectId: string): BunSQLiteDatabase<typeof schema> {
    console.log(`[DatabaseManager] Switching to project: ${projectId}`);
    return this.getConnection(projectId);
  }

  /**
   * Close a specific connection
   */
  closeConnection(projectId: string): void {
    const connection = this.connections.get(projectId);
    if (connection) {
      console.log(`[DatabaseManager] Closing connection for project: ${projectId}`);
      connection.sqliteDb.close();
      this.connections.delete(projectId);
      
      if (this.currentProjectId === projectId) {
        this.currentProjectId = null;
      }
    }
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    console.log(`[DatabaseManager] Closing all connections`);
    for (const connection of this.connections.values()) {
      connection.sqliteDb.close();
    }
    this.connections.clear();
    this.currentProjectId = null;
  }

  /**
   * Clean up old, unused connections
   */
  private cleanupOldConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [projectId, connection] of this.connections.entries()) {
      if (now - connection.lastAccessed > this.connectionTimeout) {
        toRemove.push(projectId);
      }
    }

    if (toRemove.length > 0) {
      console.log(`[DatabaseManager] Cleaning up ${toRemove.length} old connections`);
      toRemove.forEach((projectId) => this.closeConnection(projectId));
    }

    // If still over limit, remove least recently used
    if (this.connections.size >= this.maxConnections) {
      const sorted = Array.from(this.connections.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const lruProjectId = sorted[0][0];
      if (lruProjectId !== this.currentProjectId) {
        this.closeConnection(lruProjectId);
      }
    }
  }

  /**
   * Get connection status for all projects
   */
  getStatus(): { projectId: string; connected: boolean; lastAccessed: Date }[] {
    return Array.from(this.connections.entries()).map(([projectId, connection]) => ({
      projectId,
      connected: true,
      lastAccessed: new Date(connection.lastAccessed),
    }));
  }

  /**
   * Check if a project has an active connection
   */
  isConnected(projectId: string): boolean {
    return this.connections.has(projectId);
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();

// Cleanup on process exit
process.on("beforeExit", () => {
  dbManager.closeAll();
});
