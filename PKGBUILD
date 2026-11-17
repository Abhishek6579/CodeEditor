# Maintainer: Abhishek Yadav <83967453+Abhishek6579@users.noreply.github.com>
pkgname=milize
pkgver=1.0.2
pkgrel=1
pkgdesc="A lightweight code editor with an integrated terminal"
arch=('x86_64')
url="https://github.com/Abhishek6579/milize"
license=('MIT')
depends=('gtk3' 'webkit2gtk-4.1' 'libayatana-appindicator' 'librsvg' 'openssl')
makedepends=('git' 'nodejs' 'npm' 'rust' 'base-devel')
source=("${pkgname}::git+https://github.com/Abhishek6579/milize.git#branch=master")
sha256sums=('SKIP')

build() {
  cd "${srcdir}/${pkgname}"
  npm install --no-audit --no-fund
  npm run tauri -- build --no-bundle
}

package() {
  cd "${srcdir}/${pkgname}"

  install -Dm755 "src-tauri/target/release/milize" \
    "${pkgdir}/usr/bin/milize"
  install -Dm644 "src-tauri/icons/icon.png" \
    "${pkgdir}/usr/share/icons/hicolor/512x512/apps/milize.png"
  install -Dm644 "packaging/milize.desktop" \
    "${pkgdir}/usr/share/applications/milize.desktop"
  install -Dm644 LICENSE \
    "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"
}