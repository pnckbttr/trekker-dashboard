import { Routes, Route } from "react-router-dom";
import { useAppData } from "@/hooks/use-data";
import { useUIStore } from "@/stores";
import { AppHeader } from "@/components/app-header";
import { ConnectionIndicator } from "@/components/shared/connection-indicator";
import { KanbanPage, ListPage, HistoryPage } from "@/pages";

export function App() {
  const { tasks, epics, project } = useAppData();
  const { connectionStatus, openCreateModal } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        projectName={project?.name}
        onNewClick={() => openCreateModal({ status: "todo" })}
      />

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
  );
}
