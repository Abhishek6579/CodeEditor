# Installation

## Arch Linux / CachyOS — clone and install

~~~bash
git clone https://github.com/Abhishek6579/milize.git
cd milize
./scripts/install.sh
~~~

The installer:

1. Checks that the system is Arch Linux or an Arch-based distribution.
2. Records which packages are already installed, then installs required runtime libraries and missing build tools with pacman.
3. Clones the source into a temporary build directory (the caller's checkout is never modified).
4. Installs frontend dependencies and compiles Milize inside that temporary directory.
5. Installs the executable, desktop entry, icon and license under `/usr/local`.
6. Removes the temporary source, `node_modules` and Rust build output. It attempts to remove build-only packages newly installed by this run while preserving pre-existing packages and runtime libraries.

Run it as your normal user, not with sudo. The first build can take several minutes.

## One-command Arch installation

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/install.sh | bash
~~~

## AppImage — portable launch

An AppImage can be launched without installation:

~~~bash
chmod +x Milize_*.AppImage
./Milize_*.AppImage
~~~

A portable AppImage does not automatically register itself with every Linux desktop environment. If you want Milize to appear in the application menu, integrate it into your user account:

~~~bash
git clone https://github.com/Abhishek6579/milize.git
cd milize
./scripts/integrate-appimage.sh ~/Downloads/Milize_1.0.2_amd64.AppImage
~~~

The script copies the AppImage to `~/.local/opt/milize/`, extracts its bundled desktop entry and icon, and creates a launcher under `~/.local/share/applications/`. It does not require root. The launcher uses the installed copy, so do not delete or move that copy after integration.

To remove this user-level AppImage integration:

~~~bash
rm -f ~/.local/share/applications/milize.desktop
rm -rf ~/.local/opt/milize
rm -f ~/.local/share/icons/hicolor/512x512/apps/milize.png
~~~

## Uninstall the system-wide installation

From a source checkout:

~~~bash
./scripts/uninstall.sh
~~~

This removes the system-wide files installed by the Arch source installer. Shared runtime libraries and pre-existing build tools are deliberately left installed.

## Arch package

An Arch PKGBUILD is provided at the repository root. To build and install from a checkout:

~~~bash
makepkg -si
~~~

## Debian / Ubuntu

Download the `.deb` package from [GitHub Releases](https://github.com/Abhishek6579/milize/releases), then install it with your package manager:

~~~bash
sudo apt install ./Milize_1.0.2_amd64.deb
~~~

The package manager installs the desktop entry and icon for the application launcher.

## Build manually

Install Tauri's Linux platform dependencies, Node.js and Rust, then:

~~~bash
npm install
npm run tauri dev
~~~

For production bundles:

~~~bash
npm run tauri build
~~~
