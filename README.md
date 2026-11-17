# Milize

**Milize** is a lightweight Linux desktop code editor focused on a clean workspace for systems programming and everyday source editing. It combines a file explorer, tabbed editor and integrated terminal in one compact window.

![Platform](https://img.shields.io/badge/platform-Linux-blue) ![Version](https://img.shields.io/badge/version-1.0.0-informational) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Tabbed editing** with file open, create, save and close workflows.
- **Project explorer** with expandable folders, file-type icons, hidden scrollbar and adjustable width.
- **Syntax highlighting** powered by CodeMirror 6 language packages, including C/C++, Verilog/SystemVerilog, Rust, Go, Java, JavaScript/TypeScript, Python, HTML, CSS, JSON, YAML, TOML, SQL, Markdown and more.
- **Integrated terminal** backed by a native PTY, using the user's configured shell executable.
- **Workspace restoration** remembers the last project folder, open files, active file and cursor positions.
- **Independent editor and terminal zoom**.
- **Catppuccin Mocha** colour scheme.

## Install on Arch Linux / CachyOS

Clone the repository and run the installer:

~~~bash
git clone https://github.com/Abhishek6579/milize.git
cd milize
./scripts/install.sh
~~~

The installer checks that the system is Arch-based, installs the required runtime libraries and any missing build tools, then builds Milize in a temporary directory. After a successful installation it removes the temporary source tree, `node_modules`, Rust build output and build-only packages newly installed by the script when pacman confirms they can be safely removed. Existing packages and shared runtime libraries are left untouched. The installed executable, icon and application-menu entry are placed under `/usr/local`.

You can also run the installer directly without cloning:

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/install.sh | bash
~~~

Run it as your normal user; it requests sudo only when required. Do not run it as root. The first installation compiles Rust and frontend dependencies and can take several minutes. Build tools that were already present before installation are not removed.

To uninstall:

~~~bash
./scripts/uninstall.sh
~~~

Or run the remote uninstaller:

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/uninstall.sh | bash
~~~

The uninstaller removes Milize application files but leaves shared system/runtime dependencies untouched. Build tools already present before installation are not automatically removed.

## Arch package

An Arch `PKGBUILD` is provided at the repository root:

~~~bash
makepkg -si
~~~

## Other Linux distributions

Official .deb and AppImage downloads, when published, are available on the [GitHub Releases](https://github.com/Abhishek6579/milize/releases) page. The source installer currently supports Arch Linux and Arch-based distributions only.

## Build prerequisites

### Arch Linux / CachyOS

~~~bash
sudo pacman -S --needed base-devel git curl file openssl gtk3 libayatana-appindicator librsvg webkit2gtk-4.1 nodejs npm rust
~~~

### Ubuntu / Debian

~~~bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
~~~

Install a current Node.js LTS release and Rust stable using their official installation instructions.

## Development

~~~bash
git clone https://github.com/Abhishek6579/milize.git
cd milize
npm install
npm run tauri dev
~~~

## Build Linux bundles

~~~bash
npm install
npm run tauri build
~~~

Generated bundles:

- `src-tauri/target/release/bundle/deb/`
- `src-tauri/target/release/bundle/appimage/`

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl+O | Open file |
| Ctrl+Shift+O | Open project folder |
| Ctrl+N | New file |
| Ctrl+S | Save current file |
| Ctrl+W | Close current tab |
| Ctrl+B | Toggle project explorer |
| Ctrl+Backtick | Focus integrated terminal |
| Ctrl+Plus / Ctrl+Minus | Zoom the focused editor or terminal |
| Ctrl+0 | Reset zoom for the focused surface |
| Ctrl+Z / Ctrl+Y | Undo / redo in the editor |

## Workspace and terminal behaviour

Workspace metadata is stored locally by the application. On restart, Milize attempts to reopen the last project, previously open files and their cursor positions. Files that no longer exist are skipped. **Unsaved editor contents are not a recovery feature**: save important changes with Ctrl+S.

The integrated terminal starts without interactive shell startup files for Fish, Bash and Zsh to avoid startup banners and side effects. As a result, custom prompts, aliases and shell startup configuration are not loaded in that terminal. Your normal external terminal is unaffected.

## Scope and limitations

Milize is an editor, not a full IDE. The current release provides syntax highlighting but does not include:

- Language Server Protocol (LSP), semantic completion or diagnostics.
- Built-in debugger, compiler or build-system integration.
- Git UI, source control operations or remote development.
- Automatic recovery of unsaved buffers.
- A settings/preferences interface.

The integrated terminal is a regular shell and can run your existing compiler and development tools.

## Project structure

~~~text
milize/
├── .github/
│   └── workflows/       # CI and release automation
├── docs/                # Architecture and installation guides
├── packaging/           # Desktop integration assets
├── scripts/             # Installer and uninstaller
├── src/                 # React frontend
├── src-tauri/           # Tauri and Rust backend
└── PKGBUILD             # Arch package recipe
~~~

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
- [xterm.js](https://xtermjs.org/) and portable-pty
- Lucide icons
- Catppuccin Mocha palette

## License

Milize is distributed under the [MIT License](LICENSE). Third-party dependencies remain under their respective licenses.
