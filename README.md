# CodeEditor

A minimal Linux desktop code editor designed around a dark charcoal/lavender interface. The current target is CachyOS/Arch Linux and other Linux distributions; Windows and macOS are intentionally out of scope.

## Stack

- Tauri 2 + Rust desktop shell
- React + TypeScript UI
- CodeMirror 6 editor
- xterm.js terminal frontend
- portable-pty for a real interactive PTY

## CachyOS / Arch Linux setup

Install system dependencies:

```bash
sudo pacman -S --needed base-devel curl wget file openssl appmenu-gtk-module gtk3 libayatana-appindicator librsvg webkit2gtk-4.1 nodejs npm rustup
rustup default stable
```

Install frontend dependencies and run the desktop app:

```bash
npm install
npm run tauri dev
```

Build Linux packages:

```bash
npm run tauri build
```

The current bundle configuration targets Debian packages and AppImage.

## Current features

- Native desktop window with mouse support
- Dark charcoal/lavender theme using local system fonts
- CodeMirror editing with line numbers, selection, bracket matching, undo/redo and search
- Verilog/SystemVerilog and C/C++ language modes
- Multiple open documents, tabs, open/save dialogs
- Integrated xterm.js terminal backed by a real PTY
- Resizable bottom terminal panel

## Roadmap / known gaps

This is an initial desktop foundation and has not yet been compiled or tested on CachyOS. The sidebar currently lists open editors rather than recursively browsing a project. Full LSP integration, diagnostics, file-tree navigation, settings, build/run profiles, terminal session lifecycle hardening, and installer testing remain future work.
