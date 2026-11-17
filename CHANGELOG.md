# Changelog

All notable changes to Milize are documented here.

## [1.0.2] - 2026-11-17

### Fixed
- Added a dedicated AppImage integration script so portable AppImage users can install a user-level desktop launcher and icon.
- Improved the desktop entry metadata with launcher keywords, startup window matching and executable validation.
- Corrected the Arch PKGBUILD version to match the application release.

### Changed
- Synchronized the npm, Tauri and Arch package versions at 1.0.2.
- Updated installation documentation to distinguish portable AppImage execution from desktop-menu integration.
- Documented user-level AppImage installation and removal.

## [1.0.1] - 2026-11-17

### Added
- Published Linux AppImage and DEB release artifacts.
- Added release automation and SHA-256 checksums.

### Changed
- Updated release metadata and installation instructions.

## [1.0.0] - 2026-11-17

### Added
- Minimal Linux desktop editor built with Tauri, React and CodeMirror.
- Tabbed files, project explorer and integrated PTY terminal.
- Syntax highlighting through CodeMirror language packages, with distinct colours for functions, declarations, constants, types and properties.
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
- Consolidated installer and uninstaller scripts under `scripts/` and aligned all documentation and CI checks.
- Added Arch Linux / CachyOS clone-and-run installation instructions.

### Notes
- See the README for current limitations.
- Syntax highlighting is provided; LSP, debugging and automatic unsaved-buffer recovery are not included.
