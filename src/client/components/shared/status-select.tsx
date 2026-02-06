"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfigStore } from "@/stores/config-store";

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  statuses: readonly string[];
  triggerClassName?: string;
}

export function StatusSelect({
  value,
  onChange,
  statuses,
  triggerClassName,
}: StatusSelectProps) {
  const getTaskStatuses = useConfigStore((state) => state.getTaskStatuses);
  const statusConfigs = getTaskStatuses();
  
  // Create a lookup map for labels
  const statusLabelMap = statusConfigs.reduce((acc, s) => {
    acc[s.key] = s.label;
    return acc;
  }, {} as Record<string, string>);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabelMap[s] || s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
