# Installation and packaging

Code is a Tauri 2 desktop application. Linux packages are produced as a Debian package (`.deb`) and an AppImage.

## Runtime requirements

The application uses GTK and WebKitGTK through Tauri. A compatible WebKitGTK runtime and GTK libraries must be available on the host system. AppImage does not guarantee that every host-specific WebKitGTK dependency is bundled.

## Arch Linux / CachyOS build dependencies

```bash
sudo pacman -S --needed base-devel curl wget file openssl gtk3 libayatana-appindicator webkit2gtk-4.1 librsvg nodejs npm rustup
rustup default stable
```

## Ubuntu / Debian build dependencies

```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev
```

Install Node.js LTS and Rust stable separately using their official distribution channels.

## Development

```bash
npm install
npm run tauri dev
```

## Production build

```bash
npm run tauri build
```

Output directories:

- `src-tauri/target/release/bundle/deb/`
- `src-tauri/target/release/bundle/appimage/`

## Debian package installation

```bash
sudo apt install ./code_1.0.0_amd64.deb
```

The exact filename and architecture suffix are determined by the build target.

## AppImage

```bash
chmod +x ./Code_1.0.0_amd64.AppImage
./Code_1.0.0_amd64.AppImage
```

The actual artifact filename is determined by Tauri and the target architecture. If the host reports missing WebKitGTK or GTK libraries, install the corresponding runtime packages from that distribution.

## Release automation

Pushing a tag matching `v*` starts the Linux release workflow. It builds both bundle formats on Ubuntu and attaches the resulting artifacts to a GitHub Release. Release automation must complete successfully before distributing those binaries.
