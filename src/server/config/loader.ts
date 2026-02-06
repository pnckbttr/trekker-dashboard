import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface StatusConfig {
  value: string;
  label: string;
  description?: string;
}

export interface PriorityConfig {
  value: number;
  label: string;
  color: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  dbPath: string;
  color?: string;
  createdAt: string;
}

export interface TrekkerConfig {
  version: string;
  projects?: ProjectConfig[];
  statuses: {
    task: StatusConfig[];
    epic: StatusConfig[];
  };
  priorities?: PriorityConfig[];
  settings?: {
    defaultProject?: string;
    theme?: string;
    showCompletedTasks?: boolean;
    autoSave?: boolean;
  };
}

const DEFAULT_CONFIG: TrekkerConfig = {
  version: "1.0.0",
  statuses: {
    task: [
      { value: "todo", label: "📝 To Do", description: "Tasks that are planned but not started" },
      { value: "in_progress", label: "🚧 In Progress", description: "Tasks that are currently being worked on" },
      { value: "feedback", label: "💬 Feedback", description: "Tasks waiting for feedback or review" },
      { value: "completed", label: "✅ Completed", description: "Tasks that are finished" },
      { value: "wont_fix", label: "❌ Won't Fix", description: "Tasks that won't be implemented" },
      { value: "archived", label: "📦 Archived", description: "Old tasks that are archived" },
    ],
    epic: [
      { value: "todo", label: "📝 To Do", description: "Epics that are planned" },
      { value: "in_progress", label: "🚧 In Progress", description: "Epics currently being worked on" },
      { value: "completed", label: "✅ Completed", description: "Epics that are finished" },
      { value: "archived", label: "📦 Archived", description: "Old epics that are archived" },
    ],
  },
  priorities: [
    { value: 0, label: "🔥 Critical", color: "#ef4444" },
    { value: 1, label: "⚠️ High", color: "#f97316" },
    { value: 2, label: "📌 Medium", color: "#eab308" },
    { value: 3, label: "📎 Low", color: "#22c55e" },
    { value: 4, label: "💤 Very Low", color: "#6b7280" },
    { value: 5, label: "🌙 Someday", color: "#9ca3af" },
  ],
};

let cachedConfig: TrekkerConfig | null = null;

/**
 * Load Trekker configuration with the following priority:
 * 1. Global config: ~/.copilot/trekker-config.json
 * 2. Project-local config: .trekker/config.json
 * 3. Default hardcoded config
 */
export function loadConfig(force = false): TrekkerConfig {
  // Return cached config unless force reload
  if (cachedConfig && !force) {
    return cachedConfig;
  }

  // Try global config first
  const globalConfigPath = join(homedir(), ".copilot", "trekker-config.json");
  if (existsSync(globalConfigPath)) {
    try {
      const fileContent = readFileSync(globalConfigPath, "utf-8");
      const config = JSON.parse(fileContent) as TrekkerConfig;
      
      // Merge with defaults to ensure all fields exist
      cachedConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        statuses: {
          task: config.statuses?.task || DEFAULT_CONFIG.statuses.task,
          epic: config.statuses?.epic || DEFAULT_CONFIG.statuses.epic,
        },
      };

      console.log("[Config] Loaded global config from ~/.copilot/trekker-config.json");
      return cachedConfig;
    } catch (error) {
      console.warn(`[Config] Failed to parse global config, trying local: ${error}`);
    }
  }

  // Fall back to project-local config
  const localConfigPath = join(process.cwd(), ".trekker", "config.json");
  if (existsSync(localConfigPath)) {
    try {
      const fileContent = readFileSync(localConfigPath, "utf-8");
      const config = JSON.parse(fileContent) as Partial<TrekkerConfig>;

      cachedConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        statuses: {
          task: config.statuses?.task || DEFAULT_CONFIG.statuses.task,
          epic: config.statuses?.epic || DEFAULT_CONFIG.statuses.epic,
        },
      };

      console.log("[Config] Loaded local config from .trekker/config.json");
      return cachedConfig;
    } catch (error) {
      console.warn(`[Config] Failed to parse local config, using defaults: ${error}`);
    }
  }

  // No config file, use defaults
  console.log("[Config] No config file found, using defaults");
  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function getTaskStatuses(): string[] {
  const config = loadConfig();
  return config.statuses.task.map((s) => s.value);
}

export function getEpicStatuses(): string[] {
  const config = loadConfig();
  return config.statuses.epic.map((s) => s.value);
}

export function getStatusLabel(
  entityType: "task" | "epic",
  statusKey: string
): string {
  const config = loadConfig();
  const statuses =
    entityType === "task" ? config.statuses.task : config.statuses.epic;
  const status = statuses.find((s) => s.value === statusKey);
  return status?.label || statusKey;
}

export function getProjects(): ProjectConfig[] {
  const config = loadConfig();
  return config.projects || [];
}

export function getProject(projectId: string): ProjectConfig | undefined {
  const projects = getProjects();
  return projects.find((p) => p.id === projectId);
}

export function getDefaultProject(): ProjectConfig | undefined {
  const config = loadConfig();
  const defaultProjectId = config.settings?.defaultProject;
  
  if (defaultProjectId) {
    return getProject(defaultProjectId);
  }
  
  // Fall back to first project
  const projects = getProjects();
  return projects[0];
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
