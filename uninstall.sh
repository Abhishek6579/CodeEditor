#!/usr/bin/env bash
set -Eeuo pipefail

if [[ -f "$(dirname -- "${BASH_SOURCE[0]}")/scripts/uninstall.sh" ]]; then
  exec bash "$(dirname -- "${BASH_SOURCE[0]}")/scripts/uninstall.sh" "$@"
fi

curl -fsSL "https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/uninstall.sh" | bash -s -- "$@"
