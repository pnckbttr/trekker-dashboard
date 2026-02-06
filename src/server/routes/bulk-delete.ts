import { Hono } from "hono";
import { getDb, getSqliteInstance } from "../lib/db";
import { ValidationError, DatabaseError } from "../errors";

const app = new Hono();

type ListEntityType = "epic" | "task" | "subtask";

app.post("/", async (c) => {
  getDb();
  const sqlite = getSqliteInstance();
  if (!sqlite) {
    throw new DatabaseError("Database not initialized");
  }

  const typeParam = c.req.query("type");
  const types = typeParam ? (typeParam.split(",") as ListEntityType[]) : undefined;
  const statusParam = c.req.query("status");
  const statuses = statusParam ? statusParam.split(",") : undefined;
  const priorityParam = c.req.query("priority");
  const priorities = priorityParam
    ? priorityParam.split(",").map((p) => parseInt(p, 10))
    : undefined;
  const since = c.req.query("since");
  const until = c.req.query("until");

  // Build filter conditions (same as list.ts)
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (types && types.length > 0) {
    const placeholders = types.map(() => "?").join(", ");
    conditions.push(`type IN (${placeholders})`);
    params.push(...types);
  }

  if (statuses && statuses.length > 0) {
    const placeholders = statuses.map(() => "?").join(", ");
    conditions.push(`status IN (${placeholders})`);
    params.push(...statuses);
  }

  if (priorities && priorities.length > 0) {
    const placeholders = priorities.map(() => "?").join(", ");
    conditions.push(`priority IN (${placeholders})`);
    params.push(...priorities);
  }

  if (since) {
    const sinceDate = new Date(since);
    conditions.push("created_at >= ?");
    params.push(Math.floor(sinceDate.getTime() / 1000));
  }

  if (until) {
    const untilDate = new Date(until);
    conditions.push("created_at <= ?");
    params.push(Math.floor(untilDate.getTime() / 1000));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get all matching items
  const baseQuery = `
    SELECT 'epic' as type, id, status, priority, created_at FROM epics
    UNION ALL
    SELECT 'task' as type, id, status, priority, created_at FROM tasks WHERE parent_task_id IS NULL
    UNION ALL
    SELECT 'subtask' as type, id, status, priority, created_at FROM tasks WHERE parent_task_id IS NOT NULL
  `;

  const query = `SELECT * FROM (${baseQuery}) ${whereClause}`;
  const stmt = sqlite.prepare(query);
  const items = stmt.all(...params) as { type: string; id: string }[];

  // Delete items by type
  let deletedCount = 0;
  const deleteEpicStmt = sqlite.prepare("DELETE FROM epics WHERE id = ?");
  const deleteTaskStmt = sqlite.prepare("DELETE FROM tasks WHERE id = ?");

  for (const item of items) {
    if (item.type === "epic") {
      deleteEpicStmt.run(item.id);
      deletedCount++;
    } else if (item.type === "task" || item.type === "subtask") {
      deleteTaskStmt.run(item.id);
      deletedCount++;
    }
  }

  return c.json({ 
    success: true, 
    deletedCount,
    message: `Deleted ${deletedCount} item(s)` 
  });
});

export default app;
