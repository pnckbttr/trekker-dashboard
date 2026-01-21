import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelative(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function formatDate(date: string | Date, format = "MMM D, YYYY"): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("MMM D, YYYY h:mm A");
}

export function formatRelativeTime(date: string | Date): string {
  const now = dayjs();
  const then = dayjs(date);
  const diffMins = now.diff(then, "minute");
  const diffHours = now.diff(then, "hour");
  const diffDays = now.diff(then, "day");

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.format("MMM D, YYYY");
}
