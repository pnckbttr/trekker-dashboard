"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import {
  useHistory,
  HistoryFilters,
  HistoryEntityType,
  HistoryAction,
  HistoryEvent,
} from "@/hooks/use-history";
import { useAppData } from "@/hooks/use-data";
import { useUIStore } from "@/stores";
import { useProjectStore } from "@/stores/project-store";
import { TaskDetailModal } from "@/components/task-detail";
import { EpicDetailModal } from "@/components/epic-detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import { ActionIcon, getActionColor } from "@/components/shared";

const TYPE_OPTIONS: { value: HistoryEntityType; label: string }[] = [
  { value: "epic", label: "Epic" },
  { value: "task", label: "Task" },
  { value: "subtask", label: "Subtask" },
  { value: "comment", label: "Comment" },
  { value: "dependency", label: "Dependency" },
];

const ACTION_OPTIONS: { value: HistoryAction; label: string; icon: typeof Plus }[] = [
  { value: "create", label: "Created", icon: Plus },
  { value: "update", label: "Updated", icon: Pencil },
  { value: "delete", label: "Deleted", icon: Trash2 },
];

function EventItem({
  event,
  onEntityClick,
}: {
  event: HistoryEvent;
  onEntityClick: (type: HistoryEntityType, id: string) => void;
}) {
  const title =
    event.snapshot?.title ||
    (event.changes?.title as { from?: string; to?: string })?.to ||
    (event.changes?.title as { from?: string; to?: string })?.from ||
    null;

  const canClick = event.action !== "delete" && ["epic", "task", "subtask"].includes(event.entityType);

  return (
    <div className="flex gap-3 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="mt-0.5">
        <ActionIcon action={event.action} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <button
            className={cn(
              "font-mono text-sm",
              canClick && "hover:underline cursor-pointer",
              event.action === "delete" && "line-through text-muted-foreground"
            )}
            onClick={() => canClick && onEntityClick(event.entityType, event.entityId)}
            disabled={!canClick}
          >
            {event.entityId}
          </button>
          <span className={cn("text-sm font-medium", getActionColor(event.action))}>
            {event.action}d
          </span>
          <Badge variant="outline" className="text-xs">
            {event.entityType}
          </Badge>
        </div>

        {title && (
          <p
            className={cn(
              "text-sm mb-2",
              event.action === "delete" && "line-through text-muted-foreground"
            )}
          >
            {title as string}
          </p>
        )}

        {event.changes && Object.keys(event.changes).length > 0 && (
          <div className="text-xs space-y-1">
            {Object.entries(event.changes).map(([field, change]) => {
              const { from, to } = change as { from: unknown; to: unknown };
              return (
                <div key={field} className="flex items-center gap-1 text-muted-foreground">
                  <span className="font-medium">{field}:</span>
                  <span className="line-through">{String(from)}</span>
                  <span>→</span>
                  <span className="text-foreground">{String(to)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(event.timestamp)}
      </div>
    </div>
  );
}

export function HistoryPage() {
  const { tasks, epics, refetch } = useAppData();
  const activeProject = useProjectStore((state) => state.activeProject);
  const {
    selectedTaskId,
    selectedEpicId,
    openTaskDetail,
    openEpicDetail,
    closeTaskDetail,
    closeEpicDetail,
  } = useUIStore();

  const [filters, setFilters] = useState<HistoryFilters>({
    limit: 50,
    page: 1,
  });

  const { data, isLoading, error } = useHistory(filters);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  const selectedEpic = selectedEpicId
    ? epics.find((e) => e.id === selectedEpicId) || null
    : null;

  const handleEntityClick = (type: HistoryEntityType, id: string) => {
    if (type === "epic") {
      openEpicDetail(id);
    } else if (type === "task" || type === "subtask") {
      openTaskDetail(id);
    }
  };

  const totalPages = data ? Math.ceil(data.total / (filters.limit || 50)) : 0;

  // Show warning if project database is unavailable
  if (activeProject?.connected === false) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Database Not Found
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            The database for project "{activeProject.name}" could not be found at:
          </p>
          <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
            {activeProject.dbPath}
          </code>
          <p className="text-sm text-muted-foreground mt-4">
            Please check the database path in settings or select a different project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Type filter */}
          <Select
            value={filters.types?.join(",") || "all"}
            onValueChange={(v) => {
              if (v === "all") {
                setFilters({ ...filters, types: undefined, page: 1 });
              } else {
                setFilters({ ...filters, types: v.split(",") as HistoryEntityType[], page: 1 });
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action filter */}
          <Select
            value={filters.actions?.join(",") || "all"}
            onValueChange={(v) => {
              if (v === "all") {
                setFilters({ ...filters, actions: undefined, page: 1 });
              } else {
                setFilters({ ...filters, actions: v.split(",") as HistoryAction[], page: 1 });
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTION_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range - simplified */}
          <input
            type="date"
            className="h-9 px-3 text-sm border rounded-md bg-background"
            value={filters.since?.split("T")[0] || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                since: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                page: 1,
              })
            }
            placeholder="Since"
          />
          <input
            type="date"
            className="h-9 px-3 text-sm border rounded-md bg-background"
            value={filters.until?.split("T")[0] || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                until: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                page: 1,
              })
            }
            placeholder="Until"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-destructive">
                Error: {error instanceof Error ? error.message : "Unknown error"}
              </span>
            </div>
          ) : !data?.events.length ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">No events found</span>
            </div>
          ) : (
            <div>
              {data.events.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  onEntityClick={handleEntityClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((filters.page || 1) - 1) * (filters.limit || 50) + 1}-
              {Math.min((filters.page || 1) * (filters.limit || 50), data.total)} of {data.total}{" "}
              events
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={(filters.page || 1) <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page || 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={(filters.page || 1) >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TaskDetailModal
        task={selectedTask}
        epics={epics}
        allTasks={tasks}
        open={selectedTask !== null}
        onClose={closeTaskDetail}
        onUpdate={refetch}
        onTaskClick={(task) => openTaskDetail(task.id)}
        onEpicClick={(epic) => {
          closeTaskDetail();
          openEpicDetail(epic.id);
        }}
      />

      <EpicDetailModal
        epic={selectedEpic}
        tasks={selectedEpic ? tasks.filter((t) => t.epicId === selectedEpic.id) : []}
        open={selectedEpic !== null}
        onClose={closeEpicDetail}
        onUpdate={refetch}
        onTaskClick={(task) => {
          closeEpicDetail();
          const fullTask = tasks.find((t) => t.id === task.id);
          if (fullTask) openTaskDetail(fullTask.id);
        }}
      />
    </>
  );
}
