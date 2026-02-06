"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, Epic, Project, CreateTaskInput, UpdateTaskInput } from "@/types";

// Fetch functions
async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchEpics(): Promise<Epic[]> {
  const res = await fetch("/api/epics");
  if (!res.ok) throw new Error("Failed to fetch epics");
  return res.json();
}

async function fetchProject(): Promise<Project | null> {
  const res = await fetch("/api/project");
  if (!res.ok) return null;
  return res.json();
}

// Query hooks
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
}

export function useEpics() {
  return useQuery({
    queryKey: ["epics"],
    queryFn: fetchEpics,
  });
}

export function useProject() {
  return useQuery({
    queryKey: ["project"],
    queryFn: fetchProject,
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

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const res = await fetch("/api/tasks", {
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const res = await fetch(`/api/tasks/${id}`, {
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
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      
      // Optimistically update
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
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
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
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
      queryClient.invalidateQueries({ queryKey: ["epics"] });
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
      await queryClient.cancelQueries({ queryKey: ["epics"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["epics"] });
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
      queryClient.invalidateQueries({ queryKey: ["epics"] });
    },
  });
}
