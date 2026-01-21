export const TERMINAL_STATUSES = ["completed", "archived", "wont_fix"] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as TerminalStatus);
}
