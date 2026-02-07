"use client";

import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { StatusSelect, PrioritySelect, EditModalShell } from "@/components/shared";
import { useConfigStore } from "@/stores/config-store";
import { TaskFormData } from "./schema";
import type { Epic } from "@/types";

interface TaskEditProps {
  form: UseFormReturn<TaskFormData>;
  epics: Epic[];
  breadcrumbItems: BreadcrumbItem[];
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<boolean | undefined>;
  onCancel: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function TaskEdit({
  form,
  epics,
  breadcrumbItems,
  open,
  isDeleting,
  onClose,
  onSubmit,
  onCancel,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: TaskEditProps) {
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;
  const allTaskStatuses = useConfigStore((state) => state.getTaskStatuses());
  const taskStatuses = useMemo(() => 
    allTaskStatuses.filter((s) => s.value !== "archived"),
    [allTaskStatuses]
  );
  const title = watch("title");
  const description = watch("description");
  const status = watch("status");
  const priority = watch("priority");
  const tags = watch("tags");
  const epicId = watch("epicId");

  const handleFormSubmit = async (data: TaskFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  return (
    <EditModalShell
      open={open}
      onClose={onClose}
      breadcrumbItems={breadcrumbItems}
      formId="task-edit-form"
      isSubmitting={isSubmitting}
      isDeleting={isDeleting}
      entityName="Task"
      onCancel={onCancel}
      onDelete={onDelete}
      onDeleteConfirm={onDeleteConfirm}
      onDeleteCancel={onDeleteCancel}
    >
      <form
        id="task-edit-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 p-4"
      >
        {/* Title */}
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setValue("title", e.target.value)}
            placeholder="Task title"
            className="text-lg font-semibold"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setValue("description", e.target.value)}
            placeholder="Task description"
            rows={4}
          />
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <StatusSelect
              value={status}
              onChange={(v) => setValue("status", v)}
              statuses={taskStatuses.map((s) => s.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelect
              value={priority}
              onChange={(v) => setValue("priority", v)}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={tags}
            onChange={(e) => setValue("tags", e.target.value)}
            placeholder="bug, frontend, urgent"
          />
        </div>

        {/* Epic */}
        <div className="space-y-2">
          <Label>Epic</Label>
          <Select
            value={epicId || "none"}
            onValueChange={(v) => setValue("epicId", v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Epic</SelectItem>
              {epics.map((epic) => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.id}: {epic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </EditModalShell>
  );
}
