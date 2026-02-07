"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import type { Epic } from "@/types";
import { PriorityBadge } from "@/components/priority-badge";
import { Layers, GripVertical } from "lucide-react";

interface EpicCardProps {
  epic: Epic;
  taskCount: { total: number; completed: number };
  onClick: () => void;
}

export function EpicCard({ epic, taskCount, onClick }: EpicCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: epic.id,
  });

  const style = isDragging 
    ? { opacity: 0 }
    : {
        transform: CSS.Translate.toString(transform),
        opacity: 1,
      };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 cursor-pointer bg-blue-50 dark:bg-blue-800 hover:ring wrap-break-word ${
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
          <Layers width={16} />
          <span className="font-mono text-xs font-medium text-foreground">
            {epic.id}
          </span>
        </div>
        <PriorityBadge priority={epic.priority} />
      </div>

      <h4 className="text-sm font-medium mb-2">{epic.title}</h4>

      <div className="border-t pt-1">
        <p className="text-xs text-muted-foreground">
          {taskCount.total} tasks · {taskCount.completed} completed
        </p>
      </div>
    </div>
  );
}
