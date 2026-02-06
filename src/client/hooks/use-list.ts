"use client";

import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/stores/project-store";

export type ListEntityType = "epic" | "task" | "subtask";

export interface ListItem {
  type: ListEntityType;
  id: string;
  title: string;
  status: string;
  priority: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse {
  total: number;
  page: number;
  limit: number;
  items: ListItem[];
}

export interface ListFilters {
  types?: ListEntityType[];
  statuses?: string[];
  priorities?: number[];
  sort?: string;
  limit?: number;
  page?: number;
  since?: string;
  until?: string;
}

async function fetchList(filters: ListFilters, projectId?: string | null): Promise<ListResponse> {
  const params = new URLSearchParams();

  if (projectId) {
    params.set("projectId", projectId);
  }
  if (filters.types?.length) {
    params.set("type", filters.types.join(","));
  }
  if (filters.statuses?.length) {
    params.set("status", filters.statuses.join(","));
  }
  if (filters.priorities?.length) {
    params.set("priority", filters.priorities.join(","));
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  if (filters.limit) {
    params.set("limit", filters.limit.toString());
  }
  if (filters.page) {
    params.set("page", filters.page.toString());
  }
  if (filters.since) {
    params.set("since", filters.since);
  }
  if (filters.until) {
    params.set("until", filters.until);
  }

  const res = await fetch(`/api/list?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch list");
  }
  return res.json();
}

export function useList(filters: ListFilters) {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  
  return useQuery({
    queryKey: ["list", activeProjectId, filters],
    queryFn: () => fetchList(filters, activeProjectId),
    enabled: !!activeProjectId,
  });
}
