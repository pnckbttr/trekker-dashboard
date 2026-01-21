"use client";

import { ArrowLeftToLine, ArrowRightFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared";
import type { Task } from "@/types";

interface LinksSectionProps {
  dependsOn: string[];
  blocks: string[];
  onTaskClick?: (task: Task) => void;
  getTaskById: (id: string) => Task | undefined;
}

interface TaskLinkProps {
  taskId: string;
  variant: "depends" | "blocks";
  onClick: () => void;
}

function TaskLink({ taskId, variant, onClick }: TaskLinkProps) {
  const Icon = variant === "depends" ? ArrowLeftToLine : ArrowRightFromLine;

  return (
    <button
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono",
        "transition-colors hover:ring-1",
        variant === "depends" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:ring-amber-500/50",
        variant === "blocks" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:ring-rose-500/50"
      )}
      onClick={onClick}
      title={variant === "depends" ? "Depends on this task" : "Blocks this task"}
    >
      <Icon className="h-3 w-3" />
      {taskId}
    </button>
  );
}

export function LinksSection({
  dependsOn,
  blocks,
  onTaskClick,
  getTaskById,
}: LinksSectionProps) {
  const hasLinks = dependsOn.length > 0 || blocks.length > 0;

  if (!hasLinks) {
    return null;
  }

  const handleTaskClick = (taskId: string) => {
    const task = getTaskById(taskId);
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <div>
      <SectionHeader>Dependencies</SectionHeader>

      <div className="space-y-2">
        {dependsOn.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Depends on
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dependsOn.map((depId) => (
                <TaskLink
                  key={depId}
                  taskId={depId}
                  variant="depends"
                  onClick={() => handleTaskClick(depId)}
                />
              ))}
            </div>
          </div>
        )}

        {blocks.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Blocks
            </span>
            <div className="flex flex-wrap gap-1.5">
              {blocks.map((blockId) => (
                <TaskLink
                  key={blockId}
                  taskId={blockId}
                  variant="blocks"
                  onClick={() => handleTaskClick(blockId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
