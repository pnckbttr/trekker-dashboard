"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, X, Trash2, AlertCircle } from "lucide-react";
import { useList, ListFilters, ListEntityType, ListItem } from "@/hooks/use-list";
import { useAppData, useBulkDelete } from "@/hooks/use-data";
import { useUIStore } from "@/stores";
import { useProjectStore } from "@/stores/project-store";
import { TaskDetailModal } from "@/components/task-detail";
import { EpicDetailModal } from "@/components/epic-detail";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import {
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_STYLES,
  PRIORITY_STYLES,
} from "@/lib/constants";

const TYPE_OPTIONS: { value: ListEntityType; label: string }[] = [
  { value: "epic", label: "Epic" },
  { value: "task", label: "Task" },
  { value: "subtask", label: "Subtask" },
];

const SORT_OPTIONS = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "updated:desc", label: "Recently updated" },
  { value: "priority:asc", label: "Priority (high to low)" },
  { value: "priority:desc", label: "Priority (low to high)" },
  { value: "title:asc", label: "Title (A-Z)" },
  { value: "title:desc", label: "Title (Z-A)" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function ListPage() {
  const { tasks, epics, refetch } = useAppData();
  const bulkDelete = useBulkDelete();
  const activeProject = useProjectStore((state) => state.activeProject);
  const {
    selectedTaskId,
    selectedEpicId,
    openTaskDetail,
    openEpicDetail,
    closeTaskDetail,
    closeEpicDetail,
  } = useUIStore();

  const [filters, setFilters] = useState<ListFilters>({
    limit: 20,
    page: 1,
    sort: "created:desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, error } = useList(filters);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  const selectedEpic = selectedEpicId
    ? epics.find((e) => e.id === selectedEpicId) || null
    : null;
    
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.types) params.set("type", filters.types.join(","));
    if (filters.statuses) params.set("status", filters.statuses.join(","));
    if (filters.priorities) params.set("priority", filters.priorities.join(","));
    if (filters.since) params.set("since", filters.since);
    if (filters.until) params.set("until", filters.until);
    return params.toString();
  };
  
  const handleBulkDelete = async () => {
    const queryParams = buildQueryParams();
    await bulkDelete.mutateAsync(queryParams);
    setShowDeleteConfirm(false);
  };

  const handleRowClick = (item: ListItem) => {
    if (item.type === "epic") {
      openEpicDetail(item.id);
    } else {
      openTaskDetail(item.id);
    }
  };

  const toggleTypeFilter = (type: ListEntityType) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    setFilters({ ...filters, types: newTypes.length ? newTypes : undefined, page: 1 });
  };

  const toggleStatusFilter = (status: string) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    setFilters({ ...filters, statuses: newStatuses.length ? newStatuses : undefined, page: 1 });
  };

  const togglePriorityFilter = (priority: number) => {
    const currentPriorities = filters.priorities || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];
    setFilters({ ...filters, priorities: newPriorities.length ? newPriorities : undefined, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ limit: filters.limit, page: 1, sort: filters.sort });
    setSearchQuery("");
  };

  const hasActiveFilters = !!(filters.types?.length || filters.statuses?.length || filters.priorities?.length);

  const totalPages = data ? Math.ceil(data.total / (filters.limit || 20)) : 0;

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
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant={filters.types?.includes(value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTypeFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Status filter */}
          <Select
            value={filters.statuses?.join(",") || "all"}
            onValueChange={(v) => {
              if (v === "all") {
                setFilters({ ...filters, statuses: undefined, page: 1 });
              } else {
                setFilters({ ...filters, statuses: v.split(","), page: 1 });
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select
            value={filters.priorities?.join(",") || "all"}
            onValueChange={(v) => {
              if (v === "all") {
                setFilters({ ...filters, priorities: undefined, page: 1 });
              } else {
                setFilters({ ...filters, priorities: v.split(",").map(Number), page: 1 });
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  P{value} - {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={filters.sort || "created:desc"}
            onValueChange={(v) => setFilters({ ...filters, sort: v, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          
          {/* Bulk delete */}
          {data && data.items.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Filtered ({data.total})
            </Button>
          )}
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
          ) : !data?.items.length ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">No items found</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items
                  .filter((item) =>
                    searchQuery
                      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.id.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {item.id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            item.type === "epic" && "border-purple-500 text-purple-500",
                            item.type === "task" && "border-blue-500 text-blue-500",
                            item.type === "subtask" && "border-gray-500 text-gray-500"
                          )}
                        >
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-md truncate">{item.title}</td>
                      <td className="px-4 py-3">
                        <Badge
                          style={{
                            backgroundColor: STATUS_STYLES[item.status]?.bg || "#6b7280",
                            color: STATUS_STYLES[item.status]?.text || "#ffffff",
                          }}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: PRIORITY_STYLES[item.priority]?.bg || "#6b7280",
                            color: PRIORITY_STYLES[item.priority]?.bg || "#6b7280",
                          }}
                        >
                          P{item.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1}-
                {Math.min((filters.page || 1) * (filters.limit || 20), data.total)} of{" "}
                {data.total}
              </span>
              <Select
                value={(filters.limit || 20).toString()}
                onValueChange={(v) => setFilters({ ...filters, limit: parseInt(v, 10), page: 1 })}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
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
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Filtered Items"
        description={`Are you sure you want to delete ${data?.total || 0} item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
      />

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
