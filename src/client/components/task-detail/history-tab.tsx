"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useHistory, HistoryEvent, HistoryAction } from "@/hooks/use-history";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HistoryTabProps {
  taskId: string;
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function getActionIcon(action: HistoryAction) {
  switch (action) {
    case "create":
      return <Plus className="h-3.5 w-3.5 text-green-500" />;
    case "update":
      return <Pencil className="h-3.5 w-3.5 text-blue-500" />;
    case "delete":
      return <Trash2 className="h-3.5 w-3.5 text-red-500" />;
  }
}

function getActionColor(action: HistoryAction) {
  switch (action) {
    case "create":
      return "text-green-500";
    case "update":
      return "text-blue-500";
    case "delete":
      return "text-red-500";
  }
}

function HistoryEventItem({ event }: { event: HistoryEvent }) {
  return (
    <div className="flex gap-2.5 py-2.5 border-b last:border-b-0">
      <div className="mt-0.5">{getActionIcon(event.action)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-xs font-medium capitalize", getActionColor(event.action))}>
            {event.action}d
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>

        {event.changes && Object.keys(event.changes).length > 0 && (
          <div className="text-xs space-y-0.5">
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

        {event.action === "create" && event.snapshot && (
          <p className="text-xs text-muted-foreground">
            Task created
          </p>
        )}
      </div>
    </div>
  );
}

export function HistoryTab({ taskId }: HistoryTabProps) {
  const { data, isLoading, error } = useHistory({
    entityId: taskId,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!data?.events.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground italic">No history</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="text-sm font-medium mb-3">
        History ({data.events.length})
      </h4>
      <div>
        {data.events.map((event) => (
          <HistoryEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
