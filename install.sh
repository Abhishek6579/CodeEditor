#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="https://github.com/Abhishek6579/CodeEditor.git"
APP_NAME="Code"
BINARY_NAME="code-editor"
INSTALL_PREFIX="/usr/local"

log() { printf '\033[1;34m[Code installer]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[Code installer] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -ne 0 ]] || fail "Do not run this installer as root. Run it as your normal user; it will request sudo when needed."

if [[ ! -f /etc/arch-release ]] || ! command -v pacman >/dev/null 2>&1; then
  fail "This installer currently supports Arch Linux and Arch-based distributions such as CachyOS only."
fi

command -v sudo >/dev/null 2>&1 || fail "sudo is required to install system dependencies and application files."

log "Installing build and runtime dependencies with pacman..."
sudo pacman -S --needed --noconfirm \
  base-devel git curl file openssl gtk3 libayatana-appindicator \
  librsvg webkit2gtk-4.1 nodejs npm rust

WORK_DIR=""
CLEANUP_WORK_DIR=0
if [[ -f "package.json" && -f "src-tauri/tauri.conf.json" ]]; then
  WORK_DIR="$(pwd)"
  log "Using the existing repository at: $WORK_DIR"
else
  WORK_DIR="$(mktemp -d -t code-editor-install.XXXXXX)"
  CLEANUP_WORK_DIR=1
  log "Cloning the latest master branch..."
  git clone --depth 1 "$REPO_URL" "$WORK_DIR/CodeEditor"
  WORK_DIR="$WORK_DIR/CodeEditor"
fi

cleanup() {
  if [[ "$CLEANUP_WORK_DIR" -eq 1 ]]; then
    rm -rf "$(dirname "$WORK_DIR")"
  fi
}
trap cleanup EXIT

cd "$WORK_DIR"
[[ -f "src-tauri/icons/icon.png" ]] || fail "Application icon is missing from the repository."
[[ -f "packaging/code-editor.desktop" ]] || fail "Desktop entry is missing from the repository."

log "Installing frontend dependencies..."
npm install --no-audit --no-fund

log "Building Code for this machine. The first build can take several minutes..."
npm run tauri -- build --no-bundle

BINARY_PATH="src-tauri/target/release/$BINARY_NAME"
[[ -x "$BINARY_PATH" ]] || fail "Build completed but the expected executable was not found at $BINARY_PATH."

log "Installing the application..."
sudo install -Dm755 "$BINARY_PATH" "$INSTALL_PREFIX/bin/$BINARY_NAME"
sudo install -Dm644 "src-tauri/icons/icon.png" \
  "$INSTALL_PREFIX/share/icons/hicolor/512x512/apps/code-editor.png"
sudo install -Dm644 "packaging/code-editor.desktop" \
  "$INSTALL_PREFIX/share/applications/code-editor.desktop"
sudo install -Dm644 "LICENSE" \
  "$INSTALL_PREFIX/share/licenses/code-editor/LICENSE"

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  sudo gtk-update-icon-cache -f "$INSTALL_PREFIX/share/icons/hicolor" >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  sudo update-desktop-database "$INSTALL_PREFIX/share/applications" >/dev/null 2>&1 || true
fi

log "Installation complete. Launch Code from your application menu or run: code-editor"
