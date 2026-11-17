# Installation

## Arch Linux / CachyOS — clone and install

~~~bash
git clone https://github.com/Abhishek6579/milize.git
cd milize
./scripts/install.sh
~~~

The installer:

1. Checks that the system is Arch Linux or an Arch-based distribution.
2. Installs compiler, Node.js, Rust and Tauri system dependencies using pacman.
3. Uses the current checkout (or clones the latest master branch into a temporary build directory when run remotely).
4. Installs frontend dependencies and compiles Milize locally.
5. Installs the executable, desktop entry, icon and license under `/usr/local`.

Run it as your normal user, not with sudo. The first build can take several minutes.

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

This removes installed Milize application files but deliberately leaves build dependencies installed.

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
