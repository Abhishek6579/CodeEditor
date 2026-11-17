# Installation

## Arch Linux / CachyOS — one-command installer

Run as your normal user:

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/CodeEditor/master/install.sh | bash
~~~

The script:

1. Checks that the system is Arch Linux or an Arch-based distribution.
2. Installs the compiler, Node.js, Rust and Tauri system dependencies using pacman.
3. Clones the latest master branch into a temporary build directory (or uses the current checkout if run from the repository).
4. Installs frontend dependencies and compiles the application locally.
5. Installs the executable, desktop entry, icon and license under /usr/local.

The first build can take several minutes. It must be run as a normal user, not with sudo; sudo is used only for pacman and installation of system files.

## Install from a clone

~~~bash
git clone https://github.com/Abhishek6579/CodeEditor.git
cd CodeEditor
./install.sh
~~~

## Uninstall

~~~bash
curl -fsSL https://raw.githubusercontent.com/Abhishek6579/CodeEditor/master/uninstall.sh | bash
~~~

This removes the installed application files but deliberately leaves build dependencies installed.

## Arch package build

An Arch PKGBUILD is also provided. To build and install it from a checkout:

~~~bash
makepkg -si
~~~

It compiles the application locally and installs the binary, desktop entry, icon and license.

## Other Linux distributions

Official .deb and AppImage artifacts, when published, are available from [GitHub Releases](https://github.com/Abhishek6579/CodeEditor/releases). The one-command source installer currently supports Arch Linux and Arch-based distributions only.

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
