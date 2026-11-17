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
5. Installs only the executable, desktop entry, icon and license under `/usr/local`.
6. Removes the temporary source, `node_modules` and Rust build output. It also attempts to remove build-only packages newly installed by this run, while preserving pre-existing packages and runtime libraries. Pacman will refuse removal if another installed package still requires a candidate.

Run it as your normal user, not with sudo. The first build can take several minutes. Build tools that were already installed before running the installer are intentionally left alone.

## One-command remote installation

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/install.sh | bash
~~~

## Uninstall

From a clone:

~~~bash
./scripts/uninstall.sh
~~~

Or remotely:

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/uninstall.sh | bash
~~~

This removes installed Milize application files. Shared runtime libraries and pre-existing build tools are deliberately left installed because they may be used by other software.

## Arch package build

An Arch PKGBUILD is provided at the repository root. To build and install from a checkout:

~~~bash
makepkg -si
~~~

It compiles Milize locally and installs the binary, desktop entry, icon and license.

## Other Linux distributions

Official .deb and AppImage artifacts, when published, are available from [GitHub Releases](https://github.com/Abhishek6579/milize/releases). The source installer currently supports Arch Linux and Arch-based distributions only.

## Build manually

Install Tauri's platform dependencies, Node.js and Rust, then:

~~~bash
npm install
npm run tauri dev
~~~

For a production build:

~~~bash
npm run tauri build
~~~
