#!/usr/bin/env bash
set -Eeuo pipefail

APPIMAGE_INPUT="${1:-}"
if [[ -z "$APPIMAGE_INPUT" ]]; then
  echo "Usage: $0 /path/to/Milize.AppImage" >&2
  exit 2
fi

command -v realpath >/dev/null 2>&1 || { echo "realpath is required." >&2; exit 1; }
command -v install >/dev/null 2>&1 || { echo "install is required." >&2; exit 1; }
[[ -f "$APPIMAGE_INPUT" ]] || { echo "AppImage not found: $APPIMAGE_INPUT" >&2; exit 1; }

APPIMAGE_SOURCE="$(realpath "$APPIMAGE_INPUT")"
[[ -r "$APPIMAGE_SOURCE" ]] || { echo "AppImage is not readable." >&2; exit 1; }

APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/../opt/milize"
APP_INSTALL_DIR="$(realpath -m "$APP_INSTALL_DIR")"
ICON_DIR="$APP_DIR/icons/hicolor/512x512/apps"
DESKTOP_DIR="$APP_DIR/applications"
APPIMAGE_DEST="$APP_INSTALL_DIR/Milize.AppImage"
TEMP_DIR="$(mktemp -d -t milize-appimage.XXXXXX)"
trap 'rm -rf "$TEMP_DIR"' EXIT

mkdir -p "$APP_INSTALL_DIR" "$ICON_DIR" "$DESKTOP_DIR"
install -Dm755 "$APPIMAGE_SOURCE" "$APPIMAGE_DEST"

echo "[Milize] Extracting bundled desktop entry and icon..."
(
  cd "$TEMP_DIR"
  "$APPIMAGE_DEST" --appimage-extract >/dev/null
)

EXTRACTED_ROOT="$TEMP_DIR/squashfs-root"
[[ -d "$EXTRACTED_ROOT" ]] || { echo "Could not extract the AppImage." >&2; exit 1; }

DESKTOP_FILE="$(find "$EXTRACTED_ROOT" -type f -name 'milize.desktop' -print -quit)"
[[ -n "$DESKTOP_FILE" ]] || DESKTOP_FILE="$(find "$EXTRACTED_ROOT" -type f -path '*/applications/*.desktop' -print -quit)"
[[ -n "$DESKTOP_FILE" ]] || { echo "No desktop entry was found inside the AppImage." >&2; exit 1; }

ICON_NAME="$(sed -n 's/^Icon=//p' "$DESKTOP_FILE" | head -n1)"
ICON_NAME="${ICON_NAME##*/}"
ICON_NAME="${ICON_NAME:-milize}"
ICON_SOURCE="$(find "$EXTRACTED_ROOT" -type f \( -iname "$ICON_NAME.png" -o -iname 'milize.png' \) -print -quit)"
if [[ -z "$ICON_SOURCE" ]]; then
  ICON_SOURCE="$(find "$EXTRACTED_ROOT" -type f -path '*/icons/*' -iname '*.png' -print -quit)"
fi
[[ -n "$ICON_SOURCE" ]] || { echo "No PNG application icon was found inside the AppImage." >&2; exit 1; }

install -Dm644 "$ICON_SOURCE" "$ICON_DIR/milize.png"

cat > "$DESKTOP_DIR/milize.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Milize
GenericName=Code Editor
Comment=A lightweight code editor with an integrated terminal
Exec="$APPIMAGE_DEST" %U
TryExec="$APPIMAGE_DEST"
Icon=$ICON_DIR/milize.png
Terminal=false
StartupNotify=true
StartupWMClass=milize
DBusActivatable=false
Categories=Development;IDE;TextEditor;
Keywords=code;editor;programming;development;terminal;
MimeType=text/plain;
EOF

chmod 644 "$DESKTOP_DIR/milize.desktop"
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f "$APP_DIR/icons/hicolor" >/dev/null 2>&1 || true
fi
if command -v kbuildsycoca6 >/dev/null 2>&1; then
  kbuildsycoca6 --noincremental >/dev/null 2>&1 || true
fi

echo "[Milize] Desktop integration installed."
echo "[Milize] AppImage: $APPIMAGE_DEST"
echo "[Milize] Launcher: $DESKTOP_DIR/milize.desktop"
echo "[Milize] Milize should now appear in your desktop application launcher."
