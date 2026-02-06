import { Hono } from "hono";
import { loadConfig } from "../config/loader.js";

const app = new Hono();

// GET /api/config - Get configuration
app.get("/", (c) => {
  const config = loadConfig();
  return c.json(config);
});

export default app;
