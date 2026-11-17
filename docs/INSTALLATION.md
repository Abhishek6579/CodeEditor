# Installation and packaging

Code is a Tauri 2 desktop application. Official Linux release builds are produced as a Debian package (.deb) and an AppImage. Arch Linux users can build a native package from the included PKGBUILD.

## Arch Linux / CachyOS — native package

Install the build dependencies:

~~~bash
sudo pacman -S --needed base-devel git curl wget file openssl gtk3 libayatana-appindicator librsvg webkit2gtk-4.1 nodejs npm rust
~~~

Clone the repository and build the package:

~~~bash
git clone https://github.com/Abhishek6579/CodeEditor.git
cd CodeEditor
git checkout v1.0.0
makepkg -si
~~~

This compiles Code locally and links it against the system GTK/WebKitGTK libraries. It installs the executable, desktop entry, application icon and license. To rebuild a later release, update the checkout to its tag and run makepkg -si again.

## Ubuntu / Debian — native package

Install the Tauri build dependencies:

~~~bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
~~~

Install Node.js LTS and Rust stable separately using their official installation instructions.

Download the .deb from [GitHub Releases](https://github.com/Abhishek6579/CodeEditor/releases), then install it:

~~~bash
sudo apt install ./Code_1.0.0_amd64.deb
~~~

The exact filename and architecture suffix are determined by the release build.

## AppImage

Download the AppImage from [GitHub Releases](https://github.com/Abhishek6579/CodeEditor/releases), then:

~~~bash
chmod +x ./Code_1.0.0_amd64.AppImage
./Code_1.0.0_amd64.AppImage
~~~

The official workflow currently builds x86_64 artifacts. AppImage bundles the application, but it does not guarantee that every host-specific GTK/WebKitGTK runtime dependency is bundled. If the host reports missing WebKitGTK or GTK libraries, install the matching runtime packages from that distribution. For Arch-based systems, prefer the native PKGBUILD route above.

## Build from source

Install the platform dependencies above, then:

~~~bash
git clone https://github.com/Abhishek6579/CodeEditor.git
cd CodeEditor
npm install
npm run tauri dev
~~~

To create release bundles:

~~~bash
npm run tauri build
~~~

Output directories:

- src-tauri/target/release/bundle/deb/
- src-tauri/target/release/bundle/appimage/

## Release automation

Pushing a tag matching v* starts the Linux release workflow. It builds the x86_64 Debian package and AppImage on Ubuntu, generates SHA-256 checksums and attaches the artifacts to a GitHub Release. A release should be considered published only after the workflow completes successfully.
