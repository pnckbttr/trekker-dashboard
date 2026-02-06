import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface StatusConfig {
  key: string;
  label: string;
  color: string;
  description?: string;
}

export interface TrekkerConfig {
  version: string;
  statuses: {
    task: StatusConfig[];
    epic: StatusConfig[];
  };
  priorities: {
    levels: number;
    labels: string[];
  };
}

const DEFAULT_CONFIG: TrekkerConfig = {
  version: "1.0.0",
  statuses: {
    task: [
      {
        key: "todo",
        label: "📋 TODO",
        color: "#3b82f6",
        description: "Task is ready to be worked on",
      },
      {
        key: "in_progress",
        label: "🔨 In Progress",
        color: "#f59e0b",
        description: "Task is actively being worked on",
      },
      {
        key: "completed",
        label: "✅ Completed",
        color: "#10b981",
        description: "Task is finished",
      },
      {
        key: "wont_fix",
        label: "🚫 Won't Fix",
        color: "#6b7280",
        description: "Task won't be implemented",
      },
      {
        key: "archived",
        label: "📦 Archived",
        color: "#9ca3af",
        description: "Task is archived (hidden from board)",
      },
    ],
    epic: [
      {
        key: "todo",
        label: "📋 TODO",
        color: "#3b82f6",
        description: "Epic is planned",
      },
      {
        key: "in_progress",
        label: "🔨 In Progress",
        color: "#f59e0b",
        description: "Epic is being worked on",
      },
      {
        key: "completed",
        label: "✅ Completed",
        color: "#10b981",
        description: "Epic is finished",
      },
      {
        key: "archived",
        label: "📦 Archived",
        color: "#9ca3af",
        description: "Epic is archived",
      },
    ],
  },
  priorities: {
    levels: 6,
    labels: [
      "🔥 Critical",
      "⚡ High",
      "📌 Medium",
      "🔽 Low",
      "📥 Backlog",
      "💭 Someday",
    ],
  },
};

let cachedConfig: TrekkerConfig | null = null;

export function loadConfig(force = false): TrekkerConfig {
  // Return cached config unless force reload
  if (cachedConfig && !force) {
    return cachedConfig;
  }

  const configPath = join(process.cwd(), ".trekker", "config.json");

  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(fileContent) as Partial<TrekkerConfig>;

      // Merge with defaults to ensure all fields exist
      cachedConfig = {
        version: userConfig.version || DEFAULT_CONFIG.version,
        statuses: {
          task: userConfig.statuses?.task || DEFAULT_CONFIG.statuses.task,
          epic: userConfig.statuses?.epic || DEFAULT_CONFIG.statuses.epic,
        },
        priorities: {
          levels:
            userConfig.priorities?.levels || DEFAULT_CONFIG.priorities.levels,
          labels:
            userConfig.priorities?.labels || DEFAULT_CONFIG.priorities.labels,
        },
      };

      return cachedConfig;
    } catch (error) {
      console.warn(
        `Warning: Failed to parse config.json, using defaults: ${error}`
      );
      cachedConfig = DEFAULT_CONFIG;
      return cachedConfig;
    }
  }

  // No config file, use defaults
  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function getTaskStatuses(): string[] {
  const config = loadConfig();
  return config.statuses.task.map((s) => s.key);
}

export function getEpicStatuses(): string[] {
  const config = loadConfig();
  return config.statuses.epic.map((s) => s.key);
}

export function getStatusLabel(
  entityType: "task" | "epic",
  statusKey: string
): string {
  const config = loadConfig();
  const statuses =
    entityType === "task" ? config.statuses.task : config.statuses.epic;
  const status = statuses.find((s) => s.key === statusKey);
  return status?.label || statusKey;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
