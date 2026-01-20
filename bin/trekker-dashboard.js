#!/usr/bin/env node
import { Command } from "commander";
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { existsSync, readdirSync, cpSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

function findServerJs(baseDir, currentDir, depth = 0) {
  const dir = currentDir || baseDir;
  if (depth > 5 || !existsSync(dir)) return null;

  const serverPath = resolve(dir, "server.js");
  if (existsSync(serverPath)) {
    // Check relative path from base to avoid matching node_modules servers
    const relativePath = dir.slice(baseDir.length);
    const isNodeModulesServer = relativePath.includes("node_modules");
    if (!isNodeModulesServer) return serverPath;
  }

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "node_modules") {
        const found = findServerJs(baseDir, resolve(dir, entry.name), depth + 1);
        if (found) return found;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name("trekker-dashboard")
  .description("Kanban board dashboard for Trekker issue tracker")
  .version("1.0.0")
  .option("-p, --port <port>", "Port to run on", "3000")
  .action(async (options) => {
    const cwd = process.cwd();
    const trekkerDir = resolve(cwd, ".trekker");
    const dbPath = resolve(trekkerDir, "trekker.db");

    // Check if .trekker directory exists
    if (!existsSync(trekkerDir)) {
      console.error("Error: No .trekker directory found in current directory.");
      console.error("Run 'trekker init' first to initialize the issue tracker.");
      process.exit(1);
    }

    // Check if database exists
    if (!existsSync(dbPath)) {
      console.error("Error: No trekker.db found in .trekker directory.");
      console.error("Run 'trekker init' first to initialize the issue tracker.");
      process.exit(1);
    }

    const env = {
      ...process.env,
      TREKKER_DB_PATH: dbPath,
      PORT: options.port,
    };

    console.log(`Starting Trekker Dashboard on http://localhost:${options.port}`);
    console.log(`Using database: ${dbPath}`);
    console.log("Press Ctrl+C to stop\n");

    // Find the standalone build - Next.js nests it under the original project path
    const packageRoot = resolve(__dirname, "..");
    const standaloneBase = resolve(packageRoot, ".next", "standalone");

    // Find server.js - search for it in standalone directory
    const serverPath = findServerJs(standaloneBase);
    if (!serverPath) {
      console.error("Error: Standalone server not found.");
      console.error("The package may not have been built correctly.");
      process.exit(1);
    }
    const standaloneDir = dirname(serverPath);

    // Copy static files to the expected location if not present
    const staticSrc = resolve(packageRoot, ".next", "static");
    const staticDest = resolve(standaloneDir, ".next", "static");
    if (existsSync(staticSrc) && !existsSync(staticDest)) {
      mkdirSync(resolve(standaloneDir, ".next"), { recursive: true });
      cpSync(staticSrc, staticDest, { recursive: true });
    }

    // Copy public folder if not present
    const publicSrc = resolve(packageRoot, "public");
    const publicDest = resolve(standaloneDir, "public");
    if (existsSync(publicSrc) && !existsSync(publicDest)) {
      cpSync(publicSrc, publicDest, { recursive: true });
    }

    const server = spawn("node", [serverPath], {
      cwd: standaloneDir,
      stdio: "inherit",
      env,
    });

    server.on("error", (err) => {
      console.error(`Failed to start dashboard: ${err.message}`);
      process.exit(1);
    });

    process.on("SIGINT", () => {
      server.kill("SIGINT");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      server.kill("SIGTERM");
      process.exit(0);
    });
  });

program.parse();
