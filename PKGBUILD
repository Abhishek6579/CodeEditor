# Maintainer: Abhishek Yadav <83967453+Abhishek6579@users.noreply.github.com>
pkgname=code-editor
pkgver=1.0.0
pkgrel=2
pkgdesc="A minimal code editor with an integrated terminal"
arch=('x86_64')
url="https://github.com/Abhishek6579/CodeEditor"
license=('MIT')
depends=('gtk3' 'webkit2gtk-4.1' 'libayatana-appindicator' 'librsvg' 'openssl')
makedepends=('git' 'nodejs' 'npm' 'rust' 'base-devel')
source=("\${pkgname}::git+https://github.com/Abhishek6579/CodeEditor.git#branch=master")
sha256sums=('SKIP')

build() {
  cd "\${srcdir}/\${pkgname}"
  npm install --no-audit --no-fund
  npm run tauri -- build --no-bundle
}

package() {
  cd "\${srcdir}/\${pkgname}"

  install -Dm755 "src-tauri/target/release/code-editor" \
    "\${pkgdir}/usr/bin/code-editor"
  install -Dm644 "src-tauri/icons/icon.png" \
    "\${pkgdir}/usr/share/icons/hicolor/512x512/apps/code-editor.png"
  install -Dm644 "packaging/code-editor.desktop" \
    "\${pkgdir}/usr/share/applications/code-editor.desktop"
  install -Dm644 LICENSE \
    "\${pkgdir}/usr/share/licenses/\${pkgname}/LICENSE"
}
