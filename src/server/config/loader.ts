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

let cachedConfig: TrekkerConfig | null = null;

/**
 * Load Trekker configuration from ~/.copilot/trekker-config.json
 * Config file is REQUIRED - server will not start without it.
 */
export function loadConfig(force = false): TrekkerConfig {
  // Return cached config unless force reload
  if (cachedConfig && !force) {
    return cachedConfig;
  }

  // Only load from global config file
  const globalConfigPath = join(homedir(), ".copilot", "trekker-config.json");
  
  if (!existsSync(globalConfigPath)) {
    throw new Error(
      `Config file not found at ${globalConfigPath}\n` +
      `Please copy trekker-config.example.json to ~/.copilot/trekker-config.json`
    );
  }

  try {
    const fileContent = readFileSync(globalConfigPath, "utf-8");
    cachedConfig = JSON.parse(fileContent) as TrekkerConfig;
    console.log("[Config] Loaded global config from ~/.copilot/trekker-config.json");
    return cachedConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse config file at ${globalConfigPath}: ${error}\n` +
      `Please ensure the config file is valid JSON`
    );
  }
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
