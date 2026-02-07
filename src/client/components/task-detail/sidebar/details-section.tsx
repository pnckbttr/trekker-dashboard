"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, StatusSelect, PrioritySelect } from "@/components/shared";
import { useConfigStore } from "@/stores/config-store";
import type { Task, Epic } from "@/types";

interface DetailsSectionProps {
  task: Task;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onEpicClick?: (epic: Epic) => void;
  getEpicById: (id: string) => Epic | undefined;
}

export function DetailsSection({
  task,
  onStatusChange,
  onPriorityChange,
  onEpicClick,
  getEpicById,
}: DetailsSectionProps) {
  const epic = task.epicId ? getEpicById(task.epicId) : null;
  const tags = task.tags ? task.tags.split(",").map((t) => t.trim()) : [];
  const allTaskStatuses = useConfigStore((state) => state.getTaskStatuses());
  const taskStatuses = useMemo(() => 
    allTaskStatuses.map(s => s.value),
    [allTaskStatuses]
  );

  const handleEpicClick = () => {
    if (epic && onEpicClick) {
      onEpicClick(epic);
    }
  };

  return (
    <div>
      <SectionHeader>Details</SectionHeader>

      <div className="space-y-2">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusSelect
            value={task.status}
            onChange={onStatusChange}
            statuses={taskStatuses}
            triggerClassName="w-auto h-8 text-right"
          />
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Priority</span>
          <PrioritySelect
            value={task.priority}
            onChange={onPriorityChange}
            triggerClassName="w-auto h-8 text-right"
          />
        </div>

        {/* Epic */}
        {epic && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Epic</span>
            <button
              className="flex items-center gap-0.5 text-sm text-purple-500 hover:text-purple-600"
              onClick={handleEpicClick}
            >
              {epic.id}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Tags</span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
