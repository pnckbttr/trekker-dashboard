"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, Epic, Project, CreateTaskInput, UpdateTaskInput } from "@/types";
import { useProjectStore } from "@/stores/project-store";

// Fetch functions
async function fetchTasks(projectId?: string | null): Promise<Task[]> {
  const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchEpics(projectId?: string | null): Promise<Epic[]> {
  const url = projectId ? `/api/epics?projectId=${projectId}` : "/api/epics";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch epics");
  return res.json();
}

async function fetchProject(projectId?: string | null): Promise<Project | null> {
  const url = projectId ? `/api/project?projectId=${projectId}` : "/api/project";
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

// Query hooks
export function useTasks() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  
  return useQuery({
    queryKey: ["tasks", activeProjectId],
    queryFn: () => fetchTasks(activeProjectId),
    enabled: !!activeProjectId,
  });
}

export function useEpics() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  
  return useQuery({
    queryKey: ["epics", activeProjectId],
    queryFn: () => fetchEpics(activeProjectId),
    enabled: !!activeProjectId,
  });
}

export function useProject() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  
  return useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => fetchProject(activeProjectId),
    enabled: !!activeProjectId,
  });
}

// Combined data hook for the main page
export function useAppData() {
  const tasksQuery = useTasks();
  const epicsQuery = useEpics();
  const projectQuery = useProject();

  return {
    tasks: tasksQuery.data ?? [],
    epics: epicsQuery.data ?? [],
    project: projectQuery.data ?? null,
    isLoading: tasksQuery.isLoading || epicsQuery.isLoading,
    error: tasksQuery.error || epicsQuery.error,
    refetch: () => {
      tasksQuery.refetch();
      epicsQuery.refetch();
      projectQuery.refetch();
    },
  };
}

// Mutation hooks
export function useCreateTask() {
  const queryClient = useQueryClient();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const url = activeProjectId ? `/api/tasks?projectId=${activeProjectId}` : "/api/tasks";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeProjectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const url = activeProjectId ? `/api/tasks/${id}?projectId=${activeProjectId}` : `/api/tasks/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", activeProjectId] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", activeProjectId]);
      
      // Optimistically update
      queryClient.setQueryData<Task[]>(["tasks", activeProjectId], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id ? { ...task, ...data } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", activeProjectId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeProjectId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  return useMutation({
    mutationFn: async (id: string) => {
      const url = activeProjectId ? `/api/tasks/${id}?projectId=${activeProjectId}` : `/api/tasks/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeProjectId] });
    },
  });
}

export function useBulkArchiveCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bulk-archive-completed", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to archive completed items");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ["epics", activeProjectId] });
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queryParams: string) => {
      const res = await fetch(`/api/bulk-delete?${queryParams}`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete items");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ["epics", activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
    },
  });
}

export function useCreateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Epic, "id" | "createdAt" | "updatedAt" | "projectId">) => {
      const res = await fetch("/api/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create epic");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", activeProjectId] });
    },
  });
}

export function useUpdateEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Epic> }) => {
      const res = await fetch(`/api/epics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update epic");
      }
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["epics", activeProjectId] });
      
      // Snapshot previous value
      const previousEpics = queryClient.getQueryData<Epic[]>(["epics"]);
      
      // Optimistically update
      queryClient.setQueryData<Epic[]>(["epics"], (old) => {
        if (!old) return old;
        return old.map((epic) =>
          epic.id === id ? { ...epic, ...data } : epic
        );
      });
      
      return { previousEpics };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEpics) {
        queryClient.setQueryData(["epics"], context.previousEpics);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", activeProjectId] });
    },
  });
}

export function useDeleteEpic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/epics/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete epic");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", activeProjectId] });
    },
  });
}
