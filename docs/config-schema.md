# Trekker Global Configuration Schema

## Overview

Trekker supports a global configuration file located at `~/.copilot/trekker-config.json` that allows managing multiple projects and shared settings.

## Schema Structure

### Projects Array

Each project represents a separate Trekker workspace with its own SQLite database.

```json
{
  "projects": [
    {
      "id": "unique-project-id",
      "name": "Project Display Name",
      "dbPath": "/absolute/path/to/.trekker/trekker.db",
      "color": "#3b82f6",
      "createdAt": "2026-02-06T22:37:00.000Z"
    }
  ]
}
```

**Fields:**
- `id` (string, required): Unique identifier for the project
- `name` (string, required): Display name shown in the UI
- `dbPath` (string, required): Absolute path to the project's SQLite database
- `color` (string, optional): Hex color for project badge (default: `#3b82f6`)
- `createdAt` (string, required): ISO 8601 timestamp

### Statuses Configuration

Define custom statuses for tasks and epics globally.

```json
{
  "statuses": {
    "task": [
      {
        "value": "todo",
        "label": "📝 To Do",
        "description": "Tasks that are planned but not started"
      }
    ],
    "epic": [
      {
        "value": "todo",
        "label": "📝 To Do",
        "description": "Epics that are planned"
      }
    ]
  }
}
```

**Fields:**
- `value` (string, required): Machine-readable status identifier (stored in DB)
- `label` (string, required): Display label with emoji
- `description` (string, optional): Tooltip description

### Priorities Configuration

Define priority levels with labels and colors.

```json
{
  "priorities": [
    {
      "value": 0,
      "label": "🔥 Critical",
      "color": "#ef4444"
    }
  ]
}
```

### Settings

Global application settings.

```json
{
  "settings": {
    "defaultProject": "default",
    "theme": "system",
    "showCompletedTasks": false,
    "autoSave": true
  }
}
```

**Fields:**
- `defaultProject` (string): Project ID to load on startup
- `theme` (string): UI theme (`"light"`, `"dark"`, or `"system"`)
- `showCompletedTasks` (boolean): Show completed tasks by default
- `autoSave` (boolean): Auto-save changes

## Migration from Project-Local Config

If you have an existing `.trekker/config.json` in your project:

1. Copy the `statuses` section to `~/.copilot/trekker-config.json`
2. Add your project to the `projects` array
3. Delete `.trekker/config.json` (optional - local config is ignored if global exists)

## Fallback Behavior

- If `~/.copilot/trekker-config.json` doesn't exist, falls back to `.trekker/config.json`
- If neither exists, uses hardcoded defaults

## Example Complete Configuration

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": "1.0.0",
  "projects": [
    {
      "id": "work",
      "name": "Work Projects",
      "dbPath": "/home/user/work/.trekker/trekker.db",
      "color": "#3b82f6"
    },
    {
      "id": "personal",
      "name": "Personal Projects",
      "dbPath": "/home/user/personal/.trekker/trekker.db",
      "color": "#22c55e"
    }
  ],
  "statuses": {
    "task": [
      { "value": "todo", "label": "📝 To Do" },
      { "value": "in_progress", "label": "🚧 In Progress" },
      { "value": "completed", "label": "✅ Completed" }
    ],
    "epic": [
      { "value": "todo", "label": "📝 To Do" },
      { "value": "in_progress", "label": "🚧 In Progress" },
      { "value": "completed", "label": "✅ Completed" }
    ]
  },
  "priorities": [
    { "value": 0, "label": "🔥 Critical", "color": "#ef4444" },
    { "value": 1, "label": "⚠️ High", "color": "#f97316" },
    { "value": 2, "label": "📌 Medium", "color": "#eab308" }
  ],
  "settings": {
    "defaultProject": "work",
    "theme": "dark",
    "showCompletedTasks": false
  }
}
```
