#!/usr/bin/env bash
set -Eeuo pipefail

# Keep the clone-and-run entry point at the repository root.
if [[ -f "$(dirname -- "${BASH_SOURCE[0]}")/scripts/install.sh" ]]; then
  exec bash "$(dirname -- "${BASH_SOURCE[0]}")/scripts/install.sh" "$@"
fi

# Also support: curl -fsSL <raw install.sh> | bash
curl -fsSL "https://raw.githubusercontent.com/Abhishek6579/milize/master/scripts/install.sh" | bash -s -- "$@"
