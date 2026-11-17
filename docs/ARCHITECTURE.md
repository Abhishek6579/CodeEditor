# Architecture

## Overview

Code is a single-window Linux desktop application. The frontend owns presentation and editor state; the Rust/Tauri backend owns filesystem access and the terminal process.

```text
React + TypeScript
  ├── Project explorer and tabs
  ├── CodeMirror editor
  ├── xterm.js terminal view
  └── Workspace metadata (local storage)
          │ Tauri invoke / events
          ▼
Rust + Tauri
  ├── File read/write
  ├── Directory listing
  └── portable-pty shell process
```

## Frontend

- `src/App.tsx`: application state, tabs, explorer, editor lifecycle, terminal integration and keyboard shortcuts.
- `src/style.css`: layout, Catppuccin Mocha theme and component styling.
- CodeMirror 6 provides editing and syntax highlighting.
- xterm.js renders terminal output and forwards user input.

## Backend

- `src-tauri/src/lib.rs`: Tauri commands and PTY lifecycle.
- `read_file`, `write_file`, `list_dir`: local filesystem operations.
- `start_terminal`, `terminal_write`, `terminal_resize`, `terminal_close`: integrated terminal lifecycle.
- `terminal_change_directory`: changes the running shell's working directory.
- `portable-pty`: cross-platform PTY abstraction used by the Rust backend.

## Workspace persistence

The frontend stores workspace metadata in browser local storage under a versioned key. It remembers the root directory, open file paths, active file and cursor line/column. File contents are read from disk during restoration. Unsaved buffers are not persisted.

## Terminal startup

The integrated terminal uses the executable named by `$SHELL`, falling back to Bash. Fish, Bash and Zsh are started with their startup configuration disabled to avoid startup banners and configuration side effects. This means shell aliases and custom prompts are not loaded.

## Security boundaries

The application currently runs with filesystem access through explicit Tauri commands and a local PTY. The Tauri Content Security Policy is currently disabled in the configuration. Revisit the CSP and command permission model before adding remote content, plugins or a broader extension system.
