"use client";

import { NavLink } from "react-router-dom";
import { Plus, Package, GitBranchPlus, Kanban, List, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationToggle } from "@/components/notification-toggle";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  onNewClick?: () => void;
}

const navItems = [
  { to: "/", label: "Kanban", icon: Kanban },
  { to: "/list", label: "List", icon: List },
  { to: "/history", label: "History", icon: History },
];

export function AppHeader({ onNewClick }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-2 bg-accent/50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <GitBranchPlus />
          <h1 className="text-lg font-bold">trekker</h1>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          {onNewClick && (
            <Button size="sm" onClick={onNewClick}>
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          )}
          <NotificationToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
