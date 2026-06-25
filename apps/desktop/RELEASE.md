# Release Process

## Desktop App Release

1. Update version in `apps/desktop/package.json`
2. Create a new git tag: `git tag maestro-desktop-vX.Y.Z`
3. Push the tag: `git push origin maestro-desktop-vX.Y.Z`
4. GitHub Actions will build and publish the release

## Manual Build

```bash
cd apps/desktop
bun install
bun run build
bun run package
```

The packaged installer will be in `apps/desktop/release/`.

## Channels

- **stable**: Default channel, tagged releases only
- **canary**: Built from `electron-builder.canary.ts` config
