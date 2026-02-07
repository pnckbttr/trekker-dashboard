import { useProjectStore } from "../../stores/project-store";
import { ChevronLeft, Settings, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

export function ProjectSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { projects, activeProjectId, switchProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProjectClick = async (projectId: string) => {
    await switchProject(projectId);
    // If on settings page, navigate to kanban board
    if (location.pathname === '/settings') {
      navigate('/');
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-secondary border-r border-border transition-all duration-300 flex-shrink-0 h-full",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors text-left",
              activeProjectId === project.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
            title={collapsed ? project.name : undefined}
          >
            {/* Color Badge */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            />

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {project.name}
                </div>
                {project.isDefault && (
                  <div className="text-xs opacity-70">Default</div>
                )}
              </div>
            )}

            {!collapsed && project.connected !== false && (
              <div
                className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                title="Connected"
              />
            )}

            {!collapsed && project.connected === false && (
              <AlertCircle 
                className="w-4 h-4 text-destructive flex-shrink-0"
                title="Database not found"
              />
            )}
          </button>
        ))}

        {projects.length === 0 && !collapsed && (
          <div className="text-center text-sm text-muted-foreground p-4">
            No projects yet
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-foreground"
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </div>
  );
}
