import { Hono } from "hono";
import { getDb, getSqliteInstance } from "../lib/db";

const app = new Hono();

type SearchEntityType = "epic" | "task" | "subtask" | "comment";

interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  snippet: string;
  score: number;
  status: string | null;
  parentId: string | null;
}

// GET /api/search - Full-text search
app.get("/", async (c) => {
  try {
    // Ensure DB is initialized
    getDb();
    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return c.json({ error: "Database not initialized" }, 500);
    }

    const query = c.req.query("q");
    if (!query) {
      return c.json({ error: "Query parameter 'q' is required" }, 400);
    }

    const typeParam = c.req.query("type");
    const types = typeParam ? typeParam.split(",") as SearchEntityType[] : undefined;
    const status = c.req.query("status");
    const limit = parseInt(c.req.query("limit") || "20", 10);
    const page = parseInt(c.req.query("page") || "1", 10);
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = ["search_index MATCH ?"];
    const params: (string | number)[] = [query];

    if (types && types.length > 0) {
      const placeholders = types.map(() => "?").join(", ");
      conditions.push(`entity_type IN (${placeholders})`);
      params.push(...types);
    }

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    const whereClause = conditions.join(" AND ");

    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM search_index
      WHERE ${whereClause}
    `;
    const countResult = sqlite.query(countQuery).get(...params) as { total: number } | null;
    const total = countResult?.total ?? 0;

    // Get paginated results with relevance scoring and snippets
    const searchQuery = `
      SELECT
        entity_id,
        entity_type,
        title,
        snippet(search_index, 3, '**', '**', '...', 32) as snippet,
        bm25(search_index) as score,
        status,
        parent_id
      FROM search_index
      WHERE ${whereClause}
      ORDER BY bm25(search_index)
      LIMIT ? OFFSET ?
    `;

    const results = sqlite.query(searchQuery).all(...params, limit, offset) as Array<{
      entity_id: string;
      entity_type: string;
      title: string | null;
      snippet: string;
      score: number;
      status: string | null;
      parent_id: string | null;
    }>;

    return c.json({
      query,
      total,
      page,
      limit,
      results: results.map((row) => ({
        type: row.entity_type as SearchEntityType,
        id: row.entity_id,
        title: row.title,
        snippet: row.snippet,
        score: Math.abs(row.score),
        status: row.status || null,
        parentId: row.parent_id || null,
      })),
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

export default app;
