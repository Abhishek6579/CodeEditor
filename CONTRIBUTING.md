# Contributing

Contributions are welcome. Keep changes focused and preserve the application's minimal interface.

## Development setup

1. Install the platform dependencies described in [Installation](docs/INSTALLATION.md).
2. Install Node.js LTS and Rust stable.
3. Clone the repository and install frontend dependencies:

   ```bash
   git clone https://github.com/Abhishek6579/CodeEditor.git
   cd CodeEditor
   npm install
   ```

4. Start the desktop application:

   ```bash
   npm run tauri dev
   ```

## Before submitting a change

Run the checks relevant to your change:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri build
```

The Tauri build requires the native Linux development libraries listed in the installation guide.

## Pull requests

- Explain the problem and the behaviour change.
- Include screenshots for visible UI changes.
- Keep unrelated formatting and refactoring out of the diff.
- Update documentation and the changelog when behaviour or user-facing features change.
- Do not commit build output, local environment files, credentials or personal workspace data.
- Confirm that new dependencies are necessary and appropriately licensed.

## Code conventions

- Use TypeScript types for frontend state and Tauri command payloads.
- Keep filesystem and PTY operations in the Rust backend.
- Keep UI styling consistent with the existing Catppuccin Mocha palette.
- Preserve keyboard accessibility and existing shortcuts.
