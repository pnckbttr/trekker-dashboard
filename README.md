# Trekker Dashboard

A kanban board dashboard for [Trekker](https://github.com/obsfx/trekker) issue tracker. Provides a visual interface for managing tasks, epics, and dependencies stored in the local SQLite database.

## Install

```bash
bun install -g @obsfx/trekker-dashboard
```

Or with npm:

```bash
npm install -g @obsfx/trekker-dashboard
```

## Usage

Navigate to a directory with a `.trekker` database and start the dashboard:

```bash
cd your-project
trekker-dashboard
```

Options:

```bash
trekker-dashboard -p 8080    # Start on custom port (default: 3000)
trekker-dashboard --help     # Show help
```

## Requirements

- A project initialized with Trekker (`trekker init`)
- Bun runtime (for best performance) or Node.js 18+

## Features

- Kanban board with tasks grouped by status (TODO, In Progress, Completed)
- Epic filtering to focus on specific features
- Task details including dependencies, subtasks, and tags
- Create, edit, and delete tasks directly from the UI
- Real-time updates via Server-Sent Events
- Dark mode support

## How It Works

The dashboard connects to the same `.trekker/trekker.db` SQLite database used by the Trekker CLI. Any changes made in the dashboard are immediately visible in the CLI and vice versa.

## Related

- [Trekker CLI](https://github.com/obsfx/trekker) - The main CLI tool for issue tracking

## License

MIT
