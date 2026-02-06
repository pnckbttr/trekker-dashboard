import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAppData } from "@/hooks/use-data";
import { useUIStore } from "@/stores";
import { useConfigStore } from "@/stores/config-store";
import { useProjectStore } from "@/stores/project-store";
import { AppHeader } from "@/components/app-header";
import { ConnectionIndicator } from "@/components/shared/connection-indicator";
import { CreateModal } from "@/components/create-modal";
import { ProjectSidebar } from "@/components/sidebar/project-sidebar";
import { KanbanPage, ListPage, HistoryPage } from "@/pages";

export function App() {
  const { tasks, epics, project, refetch } = useAppData();
  const {
    connectionStatus,
    showCreateModal,
    createModalDefaults,
    openCreateModal,
    closeCreateModal,
  } = useUIStore();
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  // Load config and projects on app start
  useEffect(() => {
    fetchConfig();
    fetchProjects();
  }, [fetchConfig, fetchProjects]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        projectName={project?.name}
        onNewClick={() => openCreateModal({ status: "todo" })}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Project Sidebar */}
        <ProjectSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<KanbanPage />} />
            <Route path="/list" element={<ListPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>

          <footer className="px-4 py-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {tasks.length} tasks across {epics.length} epics
              </span>
              <ConnectionIndicator status={connectionStatus} />
            </div>
          </footer>
        </div>
      </div>

      <CreateModal
        open={showCreateModal}
        onClose={closeCreateModal}
        onCreated={refetch}
        epics={epics}
        tasks={tasks}
        defaultStatus={createModalDefaults.status || "todo"}
      />
    </div>
  );
}
