import { Context, Next } from "hono";
import { dbManager } from "../lib/database-manager.js";
import { getDefaultProject } from "../config/loader.js";

/**
 * Middleware to inject database connection based on project context
 * 
 * Checks for projectId in:
 * 1. Query parameter: ?projectId=xxx
 * 2. Header: X-Project-Id
 * 3. Falls back to default project
 */
export async function projectContextMiddleware(c: Context, next: Next) {
  // Get project ID from query or header
  const projectIdFromQuery = c.req.query("projectId");
  const projectIdFromHeader = c.req.header("X-Project-Id");
  const projectId = projectIdFromQuery || projectIdFromHeader;

  let dbConnection;

  if (projectId) {
    // Use specified project
    try {
      dbConnection = dbManager.getConnection(projectId);
      c.set("projectId", projectId);
    } catch (error) {
      return c.json(
        { error: `Failed to connect to project: ${projectId}` },
        400
      );
    }
  } else {
    // Fall back to default project
    const defaultProject = getDefaultProject();
    
    if (!defaultProject) {
      return c.json(
        { error: "No project specified and no default project configured" },
        400
      );
    }

    try {
      dbConnection = dbManager.getConnection(defaultProject.id);
      c.set("projectId", defaultProject.id);
    } catch (error) {
      return c.json(
        { error: `Failed to connect to default project: ${defaultProject.id}` },
        500
      );
    }
  }

  // Store DB connection in context for use by routes
  c.set("db", dbConnection);

  await next();
}
