import { useState } from "react";
import { useProjectStore, Project } from "../stores/project-store";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/shared/confirm-dialog";

export function SettingsPage() {
  const { projects, addProject, removeProject, updateProject } = useProjectStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dbPath: "",
    color: "#3b82f6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Update existing project
      const response = await fetch(`/api/projects/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { project } = await response.json();
        updateProject(editingId, project);
        setEditingId(null);
        setFormData({ name: "", dbPath: "", color: "#3b82f6" });
      }
    } else {
      // Create new project
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { project } = await response.json();
        addProject(project);
        setShowAddForm(false);
        setFormData({ name: "", dbPath: "", color: "#3b82f6" });
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      dbPath: project.dbPath,
      color: project.color || "#3b82f6",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      removeProject(projectId);
      setDeleteConfirm(null);
    }
  };

  const handleTestConnection = async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}/test-connection`, {
      method: "POST",
    });

    const result = await response.json();
    if (result.success) {
      alert("Connection successful!");
    } else {
      alert(`Connection failed: ${result.error}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Project Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your Trekker projects
            </p>
          </div>

          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-secondary p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Project" : "New Project"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  placeholder="My Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Database Path
                </label>
                <input
                  type="text"
                  value={formData.dbPath}
                  onChange={(e) =>
                    setFormData({ ...formData, dbPath: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md font-mono text-sm"
                  placeholder="/home/user/project/.trekker/trekker.db"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Absolute path to the project's SQLite database
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Color Badge
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.color}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update Project" : "Create Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ name: "", dbPath: "", color: "#3b82f6" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-secondary p-4 rounded-lg flex items-center gap-4"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{project.name}</h3>
                  {project.isDefault && (
                    <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
                      Default
                    </span>
                  )}
                  {project.connected && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {!project.connected && (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {project.dbPath}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection(project.id)}
                >
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(project)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No projects configured yet.</p>
              <p className="text-sm mt-2">
                Click "Add Project" to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This will only remove it from the dashboard configuration - the database file will not be deleted."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
