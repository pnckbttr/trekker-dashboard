import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Project {
  id: string;
  name: string;
  dbPath: string;
  color?: string;
  createdAt: string;
  connected?: boolean;
  isDefault?: boolean;
}

interface ProjectState {
  // State
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;

  // Computed
  activeProject: Project | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setActiveProject: (projectId: string) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utilities
  fetchProjects: () => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      activeProjectId: null,
      loading: false,
      error: null,

      // Computed properties
      get activeProject() {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId) || null;
      },

      // Actions
      setProjects: (projects) => set({ projects }),
      
      setActiveProject: (projectId) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          set({ activeProjectId: projectId, error: null });
        } else {
          set({ error: `Project not found: ${projectId}` });
        }
      },

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        })),

      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Fetch projects from API
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/projects");
          if (!response.ok) {
            throw new Error("Failed to fetch projects");
          }

          const data = await response.json();
          const projects = data.projects || [];
          
          set({ projects, loading: false });

          // Set active project to default if none selected
          const { activeProjectId } = get();
          if (!activeProjectId && projects.length > 0) {
            const defaultProject = projects.find((p: Project) => p.isDefault);
            const initialProject = defaultProject || projects[0];
            set({ activeProjectId: initialProject.id });
          }
        } catch (error) {
          console.error("[ProjectStore] Failed to fetch projects:", error);
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: false,
          });
        }
      },

      // Switch to a different project
      switchProject: async (projectId) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);

        if (!project) {
          set({ error: `Project not found: ${projectId}` });
          return;
        }

        console.log(`[ProjectStore] Switching to project: ${project.name}`);
        set({ activeProjectId: projectId, error: null });

        // Invalidate all queries when switching projects
        // This will be handled by React Query in the components
      },
    }),
    {
      name: "trekker-project-storage",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
