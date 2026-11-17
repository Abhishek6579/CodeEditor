#!/usr/bin/env bash
set -Eeuo pipefail

[[ "$(id -u)" -ne 0 ]] || { echo "Run this script as your normal user, not root." >&2; exit 1; }
command -v sudo >/dev/null 2>&1 || { echo "sudo is required." >&2; exit 1; }

sudo rm -f /usr/local/bin/code-editor
sudo rm -f /usr/local/share/applications/code-editor.desktop
sudo rm -f /usr/local/share/icons/hicolor/512x512/apps/code-editor.png
sudo rm -rf /usr/local/share/licenses/code-editor

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  sudo gtk-update-icon-cache -f /usr/local/share/icons/hicolor >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  sudo update-desktop-database /usr/local/share/applications >/dev/null 2>&1 || true
fi

echo "Code has been removed. Build dependencies were left installed."
