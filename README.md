# CodeEditor

A deliberately minimal Linux desktop code editor for CachyOS/Arch Linux. The interface follows a simple split-pane layout: tabs at the top, a project tree on the left, the editor in the centre, and an interactive terminal at the bottom. No application toolbar, branding header, settings screens, or extra panels.

## Stack

- Tauri 2 + Rust
- React + TypeScript
- CodeMirror 6
- xterm.js + portable-pty

## CachyOS setup

```bash
sudo pacman -S --needed base-devel curl wget file openssl gtk3 librsvg webkit2gtk-4.1 nodejs npm rustup
rustup default stable
npm install
npm run tauri dev
```

Build Linux packages:

```bash
npm run tauri build
```

## Shortcuts

- Ctrl+O: open file
- Ctrl+Shift+O: open project folder
- Ctrl+N: new file
- Ctrl+S: save
- Ctrl+W: close current tab
- Ctrl+`: focus terminal
- Ctrl+= / Ctrl+-: zoom editor and terminal
- Ctrl+0: reset zoom
- Ctrl+Z / Ctrl+Y: undo / redo (CodeMirror)

## Language modes

- Verilog / SystemVerilog: .v, .vh, .sv, .svh
- C / C++: .c, .h, .cc, .cpp, .cxx, .hpp, .hh

This is an initial implementation. It has not yet been compiled or tested on CachyOS. Syntax modes are basic; language-server diagnostics and project build integration are not included.
