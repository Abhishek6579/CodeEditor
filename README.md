# Milize

**Milize** is a lightweight Linux desktop code editor focused on a clean workspace for systems programming and everyday source editing. It combines a file explorer, tabbed editor and integrated terminal in one compact window.

![Platform](https://img.shields.io/badge/platform-Linux-blue) ![Version](https://img.shields.io/badge/version-1.0.2-informational) ![License](https://img.shields.io/badge/license-MIT-green)

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

The installer checks that the system is Arch-based, installs required runtime libraries and missing build tools, then builds Milize in a temporary directory. It installs the executable, icon and application-menu entry under `/usr/local`. Temporary source and build output are removed after installation.

Run it as your normal user; it requests sudo only when required. Do not run it as root. The first installation compiles Rust and frontend dependencies and can take several minutes.

One-command installation:

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/install.sh | bash
~~~

## AppImage (portable or integrated)

An AppImage can be launched directly and does not need installation:

~~~bash
chmod +x Milize_*.AppImage
./Milize_*.AppImage
~~~

Launching a portable AppImage does **not** reliably create an application-menu entry. To install it into your user account and register Milize in the desktop application launcher (including KDE Plasma's application menu), run:

~~~bash
./scripts/integrate-appimage.sh ./Milize_1.0.2_amd64.AppImage
~~~

The integration script copies the AppImage to `~/.local/opt/milize/`, extracts its bundled desktop metadata and icon, and creates a launcher under `~/.local/share/applications/`. It does not require root. Keep the installed AppImage at that location; the launcher points to it.

If you only want to use the AppImage temporarily, continue launching it directly. If you want a normal menu entry, use the integration script or install the DEB package on a supported Debian/Ubuntu system.

## Uninstall

From a source checkout:

~~~bash
./scripts/uninstall.sh
~~~

The source uninstaller removes the system-wide Arch installer files. For an AppImage integration installed in your home directory, remove it with:

~~~bash
rm -f ~/.local/share/applications/milize.desktop
rm -rf ~/.local/opt/milize
rm -f ~/.local/share/icons/hicolor/512x512/apps/milize.png
~~~

## Arch package

An Arch `PKGBUILD` is provided at the repository root:

~~~bash
makepkg -si
~~~

## Other Linux distributions

Official .deb and AppImage downloads are published on the [GitHub Releases](https://github.com/Abhishek6579/milize/releases) page. The source installer currently supports Arch Linux and Arch-based distributions only.

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
├── scripts/             # Installer, uninstaller and AppImage integration
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
- [xterm.js](https://xtermjs.org/)
- Lucide icons
- Catppuccin Mocha palette

## License

Milize is distributed under the [MIT License](LICENSE). Third-party dependencies remain under their respective licenses.
