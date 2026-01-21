import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { eq } from "drizzle-orm";

import tasksRoutes from "./routes/tasks";
import epicsRoutes from "./routes/epics";
import commentsRoutes from "./routes/comments";
import dependenciesRoutes from "./routes/dependencies";
import projectRoutes from "./routes/project";
import eventsRoutes from "./routes/events";
import searchRoutes from "./routes/search";
import listRoutes from "./routes/list";
import historyRoutes from "./routes/history";
import { getDb, tasks, epics } from "./lib/db";

const app = new Hono();

// CORS for development
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  })
);

// Bulk archive all completed tasks and epics
app.post("/api/bulk-archive-completed", async (c) => {
  try {
    const db = getDb();
    const now = new Date();

    // Get and archive completed tasks
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, "completed"));

    for (const task of completedTasks) {
      await db
        .update(tasks)
        .set({ status: "archived", updatedAt: now })
        .where(eq(tasks.id, task.id));
    }

    // Get and archive completed epics
    const completedEpics = await db
      .select()
      .from(epics)
      .where(eq(epics.status, "completed"));

    for (const epic of completedEpics) {
      await db
        .update(epics)
        .set({ status: "archived", updatedAt: now })
        .where(eq(epics.id, epic.id));
    }

    return c.json({
      tasksArchived: completedTasks.length,
      epicsArchived: completedEpics.length,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

// Mount API routes
app.route("/api/tasks", tasksRoutes);
app.route("/api/epics", epicsRoutes);
app.route("/api/comments", commentsRoutes);
app.route("/api/dependencies", dependenciesRoutes);
app.route("/api/project", projectRoutes);
app.route("/api/events", eventsRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/list", listRoutes);
app.route("/api/history", historyRoutes);

// Serve static files in production
const scriptDir = dirname(import.meta.url.replace("file://", ""));
const distClientPath = resolve(scriptDir, "../../dist/client");

if (existsSync(distClientPath)) {
  app.use("/*", serveStatic({ root: distClientPath }));

  // SPA fallback - serve index.html for non-API routes
  app.get("*", serveStatic({ path: resolve(distClientPath, "index.html") }));
}

// Export for CLI to use
export default app;

// Start server if run directly
const port = parseInt(process.env.PORT || "3001", 10);
console.log(`Server starting on http://localhost:${port}`);

export const server = Bun.serve({
  port,
  fetch: app.fetch,
});
