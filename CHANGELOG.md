# Changelog

All notable changes to Milize are documented here.

## [1.0.0] - 2026-11-17

### Added
- Minimal Linux desktop editor built with Tauri, React and CodeMirror.
- Tabbed files, project explorer and integrated PTY terminal.
- Syntax highlighting through CodeMirror language packages.
- Catppuccin Mocha editor and terminal theme.
- Lucide file and folder icons with extension-specific colours.
- Resizable and hideable project explorer.
- Independent editor and terminal zoom controls.
- Workspace restoration for the last project, open files, active tab and cursor positions.
- Terminal startup configuration suppression for Fish, Bash and Zsh.
- Debian and AppImage bundle targets.
- Initial user, build, architecture and security documentation.

### Release preparation
- Standardized application, package, binary and Tauri identifiers as Milize.
- Updated repository links and installation instructions for the renamed repository.
- Grouped installer implementation under `scripts/` while preserving root-level entry points.
- Added Arch Linux / CachyOS clone-and-run installation instructions.

### Notes
- This is the initial 1.0.0 versioned release line. See the README for current limitations.
- Syntax highlighting is provided; LSP, debugging and automatic unsaved-buffer recovery are not included.
