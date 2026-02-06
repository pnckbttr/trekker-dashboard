// Status types - dynamically loaded from config
import { getTaskStatuses, getEpicStatuses } from "../config/loader.js";

// Lazy getters for status arrays
let _taskStatuses: string[] | null = null;
let _epicStatuses: string[] | null = null;

export function getTaskStatusesArray(): string[] {
  if (!_taskStatuses) {
    _taskStatuses = getTaskStatuses();
  }
  return _taskStatuses;
}

export function getEpicStatusesArray(): string[] {
  if (!_epicStatuses) {
    _epicStatuses = getEpicStatuses();
  }
  return _epicStatuses;
}

// For backward compatibility
export const TASK_STATUSES = new Proxy([] as any[], {
  get(target, prop) {
    if (prop === 'length') return getTaskStatusesArray().length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return getTaskStatusesArray()[Number(prop)];
    }
    return (getTaskStatusesArray() as any)[prop];
  },
  has(target, prop) {
    return prop in getTaskStatusesArray();
  }
});

export const EPIC_STATUSES = new Proxy([] as any[], {
  get(target, prop) {
    if (prop === 'length') return getEpicStatusesArray().length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return getEpicStatusesArray()[Number(prop)];
    }
    return (getEpicStatusesArray() as any)[prop];
  },
  has(target, prop) {
    return prop in getEpicStatusesArray();
  }
});

export type TaskStatus = string;
export type EpicStatus = string;

// Priority type (0-5, where 0 is highest priority)
export type Priority = 0 | 1 | 2 | 3 | 4 | 5;

// ID generation types
export type EntityType = "task" | "epic" | "comment";

export const PREFIX_MAP: Record<EntityType, string> = {
  task: "TREK",
  epic: "EPIC",
  comment: "CMT",
};
