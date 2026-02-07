"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";
import { getCardType } from "@/lib/constants";
import { PriorityBadge } from "@/components/priority-badge";
import { SubtaskProgress } from "@/components/subtask-progress";
import { Layers, SquareCheck, ArrowLeftToLine, ArrowRightFromLine, GripVertical } from "lucide-react";

interface TaskCardProps {
  task: Task;
  epicName: string | null;
  subtasks: Task[];
  onClick: () => void;
}

export function TaskCard({ task, epicName, subtasks, onClick }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cardType = getCardType(task);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = isDragging 
    ? { opacity: 0 }
    : {
        transform: CSS.Translate.toString(transform),
        opacity: 1,
      };

  const completedSubtasks = subtasks.filter(
    (s) => s.status === "completed",
  ).length;

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger onClick when dragging
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={`p-2 cursor-pointer hover:ring bg-accent w-full flex flex-col wrap-break-word ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div 
            {...listeners} 
            {...attributes}
            className="cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </div>
          <SquareCheck width={16} />
          <span className="font-mono text-xs font-medium text-foreground">
            {task.id}
          </span>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <h4 className="text-sm font-medium mb-1">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {(epicName || task.tags) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {epicName && (
            <p className="text-xs flex gap-2 items-center">
              <Layers width={16} />
              {epicName}
            </p>
          )}
          {task.tags &&
            task.tags.split(",").map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
        </div>
      )}

      {(task.dependsOn.length > 0 || task.blocks.length > 0) && (
        <div className="pt-2 border-t flex flex-wrap gap-1">
          {task.dependsOn.map((depId) => (
            <span
              key={depId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title={`Depends on ${depId}`}
            >
              <ArrowLeftToLine className="h-2.5 w-2.5" />
              {depId}
            </span>
          ))}
          {task.blocks.map((blockId) => (
            <span
              key={blockId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400"
              title={`Blocks ${blockId}`}
            >
              <ArrowRightFromLine className="h-2.5 w-2.5" />
              {blockId}
            </span>
          ))}
        </div>
      )}

      {subtasks.length > 0 && (
        <SubtaskProgress
          completed={completedSubtasks}
          total={subtasks.length}
        />
      )}
    </div>
  );
}
