"use client";

import { useQuery } from "@tanstack/react-query";

export type HistoryEntityType = "epic" | "task" | "subtask" | "comment" | "dependency";
export type HistoryAction = "create" | "update" | "delete";

export interface HistoryEvent {
  id: number;
  action: HistoryAction;
  entityType: HistoryEntityType;
  entityId: string;
  snapshot: Record<string, unknown> | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  timestamp: string;
}

export interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  events: HistoryEvent[];
}

export interface HistoryFilters {
  entityId?: string;
  types?: HistoryEntityType[];
  actions?: HistoryAction[];
  since?: string;
  until?: string;
  limit?: number;
  page?: number;
}

async function fetchHistory(filters: HistoryFilters): Promise<HistoryResponse> {
  const params = new URLSearchParams();

  if (filters.entityId) {
    params.set("entityId", filters.entityId);
  }
  if (filters.types?.length) {
    params.set("type", filters.types.join(","));
  }
  if (filters.actions?.length) {
    params.set("action", filters.actions.join(","));
  }
  if (filters.since) {
    params.set("since", filters.since);
  }
  if (filters.until) {
    params.set("until", filters.until);
  }
  if (filters.limit) {
    params.set("limit", filters.limit.toString());
  }
  if (filters.page) {
    params.set("page", filters.page.toString());
  }

  const res = await fetch(`/api/history?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch history");
  }
  return res.json();
}

export function useHistory(filters: HistoryFilters) {
  return useQuery({
    queryKey: ["history", filters],
    queryFn: () => fetchHistory(filters),
  });
}
