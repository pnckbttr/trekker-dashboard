"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { Task, Epic } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { useConfigStore } from "@/stores/config-store";
import { useUpdateTask, useUpdateEpic } from "@/hooks/use-data";

interface KanbanBoardProps {
  tasks: Task[];
  epics: Epic[];
  onAddClick: (status: string) => void;
  onTaskClick: (task: Task) => void;
  onEpicClick: (epic: Epic) => void;
  onArchiveAllCompleted?: () => void;
}

export function KanbanBoard({
  tasks,
  epics,
  onAddClick,
  onTaskClick,
  onEpicClick,
  onArchiveAllCompleted,
}: KanbanBoardProps) {
  const getVisibleTaskStatuses = useConfigStore(
    (state) => state.getVisibleTaskStatuses
  );
  const statusColumns = getVisibleTaskStatuses();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use mutation hooks with optimistic updates
  const updateTask = useUpdateTask();
  const updateEpic = useUpdateEpic();

  // Set up drag sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // Require 10px movement before drag starts
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // 250ms delay for touch
      tolerance: 5,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const topLevelTasks = tasks.filter((task) => !task.parentTaskId);

  const getTasksByStatus = (status: string) =>
    topLevelTasks.filter((task) => task.status === status);

  const getEpicsByStatus = (status: string) =>
    epics.filter((epic) => epic.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Find the task or epic being dragged
    const task = tasks.find((t) => t.id === taskId);
    const epic = epics.find((e) => e.id === taskId);

    if (!task && !epic) return;

    // Check if status actually changed
    const currentStatus = task?.status || epic?.status;
    if (currentStatus === newStatus) return;

    // Update via mutation hooks (optimistic)
    try {
      if (task) {
        await updateTask.mutateAsync({ id: taskId, data: { status: newStatus } });
      } else if (epic) {
        await updateEpic.mutateAsync({ id: taskId, data: { status: newStatus } });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // TODO: Show error notification
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (statusColumns.length === 0) {
    return <div>Loading configuration...</div>;
  }

  // Find the active item for the drag overlay
  const activeTask = tasks.find((t) => t.id === activeId);
  const activeEpic = epics.find((e) => e.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 items-start flex-nowrap min-h-[calc(100vh-180px)] justify-center">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.value}
            label={column.label}
            tasks={getTasksByStatus(column.value)}
            epics={getEpicsByStatus(column.value)}
            allTasks={tasks}
            allEpics={epics}
            onAddClick={() => onAddClick(column.value)}
            onTaskClick={onTaskClick}
            onEpicClick={onEpicClick}
            onArchiveAll={column.value === "completed" ? onArchiveAllCompleted : undefined}
            statusKey={column.value}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[280px] opacity-90 rotate-3 shadow-2xl">
            <div className="p-2 bg-accent border-2 border-primary rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium">
                    {activeTask.id}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-medium">{activeTask.title}</h4>
            </div>
          </div>
        ) : activeEpic ? (
          <div className="w-[280px] opacity-90 rotate-3 shadow-2xl">
            <div className="p-2 bg-blue-50 dark:bg-blue-800 border-2 border-primary rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium">
                    {activeEpic.id}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-medium">{activeEpic.title}</h4>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
