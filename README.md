# Code

**Code** is a minimal Linux desktop code editor focused on a clean workspace for systems programming and everyday source editing. It combines a file explorer, tabbed editor and integrated terminal in one compact window.

![Platform](https://img.shields.io/badge/platform-Linux-blue) ![Version](https://img.shields.io/badge/version-1.0.0-informational) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Tabbed editing** with file open, create, save and close workflows.
- **Project explorer** with expandable folders, file-type icons, hidden scrollbar and adjustable width.
- **Syntax highlighting** powered by CodeMirror 6 language packages, including C/C++, Verilog/SystemVerilog, Rust, Go, Java, JavaScript/TypeScript, Python, HTML, CSS, JSON, YAML, TOML, SQL, Markdown and more.
- **Integrated terminal** backed by a native PTY, using the user's configured shell executable.
- **Workspace restoration** remembers the last project folder, open files, active file and cursor positions.
- **Independent editor and terminal zoom**.
- **Catppuccin Mocha** colour scheme.
- **Linux packages** generated as Debian packages and AppImages.

## Screenshots

Screenshots will be added after the first packaged build is validated.

## Download

Open the [Releases](https://github.com/Abhishek6579/CodeEditor/releases) page and download the package for your distribution:

| Package | Intended systems |
| --- | --- |
| `.deb` | Debian, Ubuntu and derivatives |
| `.AppImage` | Most mainstream Linux distributions (subject to host WebKitGTK/runtime compatibility) |

Do not run an unverified binary from an unofficial source. Verify release checksums when they are published.

## Install prerequisites (build from source)

The application uses Tauri 2 and WebKitGTK. Install the native build dependencies for your distribution before building.

### Arch Linux / CachyOS

```bash
sudo pacman -S --needed base-devel curl wget file openssl gtk3 librsvg webkit2gtk-4.1 nodejs npm rustup
rustup default stable
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
```

Install a current Node.js LTS release and Rust stable using their official installation instructions.

## Run in development

```bash
git clone https://github.com/Abhishek6579/CodeEditor.git
cd CodeEditor
npm install
npm run tauri dev
```

## Build packages

```bash
npm run tauri build
```

Generated Linux bundles are written under:

- `src-tauri/target/release/bundle/deb/`
- `src-tauri/target/release/bundle/appimage/`

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open project folder |
| `Ctrl+N` | New file |
| `Ctrl+S` | Save current file |
| `Ctrl+W` | Close current tab |
| `Ctrl+B` | Toggle project explorer |
| `Ctrl+`` | Focus integrated terminal |
| `Ctrl++` / `Ctrl+-` | Zoom the focused editor or terminal |
| `Ctrl+0` | Reset zoom for the focused surface |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo in the editor |

## Workspace and terminal behaviour

Workspace metadata is stored locally by the application. On restart, Code attempts to reopen the last project, previously open files and their cursor positions. Files that no longer exist are skipped. **Unsaved editor contents are not a recovery feature**: save important changes with `Ctrl+S`.

The integrated terminal starts without interactive shell startup files for Fish, Bash and Zsh to avoid startup banners and side effects. As a result, custom prompts, aliases and shell startup configuration are not loaded in that terminal. Your normal external terminal is unaffected.

## Scope and limitations

Code is an editor, not a full IDE. The current release provides syntax highlighting but does not include:

- Language Server Protocol (LSP), semantic completion or diagnostics.
- Built-in debugger, compiler or build-system integration.
- Git UI, source control operations or remote development.
- Automatic recovery of unsaved buffers.
- A settings/preferences interface.

The integrated terminal is a regular shell and can run your existing compiler and development tools.

## Documentation

- [Installation and packaging](docs/INSTALLATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Technology

- [Tauri 2](https://v2.tauri.app/) and Rust
- React 19 and TypeScript
- [CodeMirror 6](https://codemirror.net/)
- [xterm.js](https://xtermjs.org/) and `portable-pty`
- Lucide icons
- Catppuccin Mocha palette

## License

Code is distributed under the [MIT License](LICENSE). Third-party dependencies remain under their respective licenses.
