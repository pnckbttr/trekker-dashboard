import { create } from "zustand";

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

interface ConfigStore {
  config: TrekkerConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  getTaskStatuses: () => StatusConfig[];
  getEpicStatuses: () => StatusConfig[];
  getVisibleTaskStatuses: () => StatusConfig[]; // Excludes "archived"
}

// Check if config was injected by server
const injectedConfig = typeof window !== 'undefined' 
  ? (window as any).__TREKKER_CONFIG__ 
  : null;

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: injectedConfig || null,
  isLoading: false,
  error: null,

  fetchConfig: async () => {
    // If we already have injected config, don't fetch
    if (injectedConfig) {
      set({ config: injectedConfig, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      const config = await response.json();
      set({ config, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  getTaskStatuses: () => {
    const { config } = get();
    return config?.statuses.task || [];
  },

  getEpicStatuses: () => {
    const { config } = get();
    return config?.statuses.epic || [];
  },

  getVisibleTaskStatuses: () => {
    const { config } = get();
    return (
      config?.statuses.task.filter((s) => s.key !== "archived") || []
    );
  },
}));
