# Building Maestro Desktop

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- Node.js 22+
- Windows 10/11

## Development Build

```bash
cd apps/desktop
bun install
bun run dev
```

This starts electron-vite in watch mode with hot reload.

## Production Build

```bash
cd apps/desktop
bun install
bun run build
```

Output goes to `dist/`.

## Packaging

```bash
cd apps/desktop
bun run package
```

The installer will be in `release/`.

## Native Modules

The following native modules are externalized from the bundle:
- `better-sqlite3` — SQLite database
- `node-pty` — PTY terminal
- `native-keymap` — Keyboard layout detection
- `@ast-grep/napi` — AST search
- `@parcel/watcher` — File system watcher

These are declared in `runtime-dependencies.ts` and copied into the packaged app.
