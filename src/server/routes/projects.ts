import { Hono } from "hono";
import { getProjects, getProject, loadConfig, clearConfigCache } from "../config/loader.js";
import { dbManager } from "../lib/database-manager.js";
import { writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const app = new Hono();

// GET /api/projects - List all projects
app.get("/", (c) => {
  try {
    const projects = getProjects();
    const config = loadConfig();
    
    // Add connection status to each project
    const projectsWithStatus = projects.map((project) => ({
      ...project,
      connected: dbManager.isConnected(project.id),
      isDefault: project.id === config.settings?.defaultProject,
    }));

    return c.json({ projects: projectsWithStatus });
  } catch (error) {
    console.error("[Projects API] Error listing projects:", error);
    return c.json({ error: "Failed to list projects" }, 500);
  }
});

// GET /api/projects/:id - Get project details
app.get("/:id", (c) => {
  try {
    const projectId = c.req.param("id");
    const project = getProject(projectId);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json({
      ...project,
      connected: dbManager.isConnected(projectId),
    });
  } catch (error) {
    console.error("[Projects API] Error getting project:", error);
    return c.json({ error: "Failed to get project" }, 500);
  }
});

// POST /api/projects - Create new project
app.post("/", async (c) => {
  try {
    const { name, dbPath, color } = await c.req.json();

    if (!name || !dbPath) {
      return c.json({ error: "Name and dbPath are required" }, 400);
    }

    // Load current config
    const config = loadConfig(true);
    const projects = config.projects || [];

    // Generate ID from name
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Check for duplicate ID
    if (projects.some((p) => p.id === id)) {
      return c.json({ error: "Project with this name already exists" }, 400);
    }

    // Add new project
    const newProject = {
      id,
      name,
      dbPath,
      color: color || "#3b82f6",
      createdAt: new Date().toISOString(),
    };

    projects.push(newProject);

    // Save to global config
    const globalConfigPath = join(homedir(), ".copilot", "trekker-config.json");
    const updatedConfig = { ...config, projects };
    writeFileSync(globalConfigPath, JSON.stringify(updatedConfig, null, 2), "utf-8");

    // Clear cache to reload
    clearConfigCache();

    return c.json({ project: newProject }, 201);
  } catch (error) {
    console.error("[Projects API] Error creating project:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

// PUT /api/projects/:id - Update project
app.put("/:id", async (c) => {
  try {
    const projectId = c.req.param("id");
    const updates = await c.req.json();

    // Load current config
    const config = loadConfig(true);
    const projects = config.projects || [];

    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Update project
    projects[index] = {
      ...projects[index],
      ...updates,
      id: projectId, // Don't allow ID changes
    };

    // Save to global config
    const globalConfigPath = join(homedir(), ".copilot", "trekker-config.json");
    const updatedConfig = { ...config, projects };
    writeFileSync(globalConfigPath, JSON.stringify(updatedConfig, null, 2), "utf-8");

    // Clear cache
    clearConfigCache();

    return c.json({ project: projects[index] });
  } catch (error) {
    console.error("[Projects API] Error updating project:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

// DELETE /api/projects/:id - Delete project
app.delete("/:id", (c) => {
  try {
    const projectId = c.req.param("id");

    // Load current config
    const config = loadConfig(true);
    const projects = config.projects || [];

    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Close connection if open
    if (dbManager.isConnected(projectId)) {
      dbManager.closeConnection(projectId);
    }

    // Remove from config
    projects.splice(index, 1);

    // Save to global config
    const globalConfigPath = join(homedir(), ".copilot", "trekker-config.json");
    const updatedConfig = { ...config, projects };
    writeFileSync(globalConfigPath, JSON.stringify(updatedConfig, null, 2), "utf-8");

    // Clear cache
    clearConfigCache();

    return c.json({ success: true });
  } catch (error) {
    console.error("[Projects API] Error deleting project:", error);
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

// POST /api/projects/:id/test-connection - Test database connection
app.post("/:id/test-connection", (c) => {
  try {
    const projectId = c.req.param("id");
    const project = getProject(projectId);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Try to connect
    try {
      dbManager.getConnection(projectId);
      return c.json({ success: true, message: "Connection successful" });
    } catch (connError) {
      return c.json(
        { success: false, error: `Connection failed: ${connError}` },
        400
      );
    }
  } catch (error) {
    console.error("[Projects API] Error testing connection:", error);
    return c.json({ error: "Failed to test connection" }, 500);
  }
});

export default app;
