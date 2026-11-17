#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="https://github.com/Abhishek6579/milize.git"
BINARY_NAME="milize"
INSTALL_PREFIX="/usr/local"
RUNTIME_PACKAGES=(openssl gtk3 libayatana-appindicator librsvg webkit2gtk-4.1)
BUILD_PACKAGES=(base-devel git curl file nodejs npm rust)

log() { printf '\033[1;34m[Milize installer]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[Milize installer] WARNING:\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[Milize installer] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -ne 0 ]] || fail "Do not run this installer as root. Run it as your normal user; it will request sudo when needed."
[[ -f /etc/arch-release ]] && command -v pacman >/dev/null 2>&1 || fail "This installer currently supports Arch Linux and Arch-based distributions such as CachyOS only."
command -v sudo >/dev/null 2>&1 || fail "sudo is required to install system dependencies and application files."

TMP_ROOT="$(mktemp -d -t milize-build.XXXXXX)"
BEFORE_PACKAGES="$TMP_ROOT/packages-before.txt"
AFTER_PACKAGES="$TMP_ROOT/packages-after.txt"
trap 'rm -rf "$TMP_ROOT"' EXIT

# Record the user's existing package set so only build tools introduced by this
# installer are candidates for removal after a successful installation.
pacman -Qq | sort -u > "$BEFORE_PACKAGES"
BASE_DEVEL_PACKAGES=()
while IFS= read -r package; do
  [[ -n "$package" ]] && BASE_DEVEL_PACKAGES+=("$package")
done < <(pacman -Sgq base-devel)

log "Installing temporary build tools and required runtime libraries..."
sudo pacman -S --needed --noconfirm "${BUILD_PACKAGES[@]}" "${RUNTIME_PACKAGES[@]}"
pacman -Qq | sort -u > "$AFTER_PACKAGES"

log "Cloning Milize into a temporary build directory..."
git clone --depth 1 "$REPO_URL" "$TMP_ROOT/source"
cd "$TMP_ROOT/source"

[[ -f "src-tauri/icons/icon.png" ]] || fail "Application icon is missing from the repository."
[[ -f "packaging/milize.desktop" ]] || fail "Desktop entry is missing from the repository."

log "Installing frontend dependencies in the temporary directory..."
npm ci --no-audit --no-fund

log "Building Milize. The first build can take several minutes..."
npm run tauri -- build --no-bundle

BINARY_PATH="src-tauri/target/release/$BINARY_NAME"
[[ -x "$BINARY_PATH" ]] || fail "Build completed but the expected executable was not found at $BINARY_PATH."

log "Installing the application..."
sudo install -Dm755 "$BINARY_PATH" "$INSTALL_PREFIX/bin/$BINARY_NAME"
sudo install -Dm644 "src-tauri/icons/icon.png" \
  "$INSTALL_PREFIX/share/icons/hicolor/512x512/apps/milize.png"
sudo install -Dm644 "packaging/milize.desktop" \
  "$INSTALL_PREFIX/share/applications/milize.desktop"
sudo install -Dm644 "LICENSE" \
  "$INSTALL_PREFIX/share/licenses/milize/LICENSE"

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  sudo gtk-update-icon-cache -f "$INSTALL_PREFIX/share/icons/hicolor" >/dev/null 2>&1 || true
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  sudo update-desktop-database "$INSTALL_PREFIX/share/applications" >/dev/null 2>&1 || true
fi

# Remove only build packages that were not installed before this run. Runtime
# libraries are deliberately excluded. Pacman protects packages required by
# other installed software; if removal is refused, keep them rather than risk
# breaking the system.
BUILD_CANDIDATES=("${BUILD_PACKAGES[@]}" "${BASE_DEVEL_PACKAGES[@]}")
NEW_BUILD_PACKAGES=()
for package in "${BUILD_CANDIDATES[@]}"; do
  if grep -Fxq "$package" "$AFTER_PACKAGES" && ! grep -Fxq "$package" "$BEFORE_PACKAGES"; then
    NEW_BUILD_PACKAGES+=("$package")
  fi
done
if (("${#NEW_BUILD_PACKAGES[@]}" > 0)); then
  log "Removing build-only packages newly installed by this script..."
  if ! sudo pacman -Rns --noconfirm "${NEW_BUILD_PACKAGES[@]}"; then
    warn "Some build tools could not be removed because pacman found dependencies. Remove them later if no longer needed."
  fi
fi

log "Installation complete. Temporary source, node_modules and build output will now be deleted."
log "Launch Milize from your application menu or run: milize"
