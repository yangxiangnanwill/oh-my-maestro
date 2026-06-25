# Contributing to Maestro IDE

When contributing to this repository, please first discuss the change you wish to make via [issues](https://github.com/yangxiangnanwill/oh-my-maestro/issues) before making a change.

Please note we have a [code of conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Local Development Setup

See [**DEVELOPMENT.md**](./DEVELOPMENT.md) for the full guide. TL;DR:

```bash
cd apps/desktop
bun install
bun run dev
```

## Pull Request Process

1. To create a Pull Request (PR), [create a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) of the project.
2. Create your changes in your fork and [open a PR from that fork.](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)
3. Update the PR description with details of the changes. Link the issue if relevant.
4. Be sure to check the box to "Allow edits from maintainer". This allows maintainers to update your PR if necessary which speeds up the review process.
5. Ensure all tests pass and lint checks are clean before submitting.

## Coding Standards

- Follow the project's TypeScript strict mode conventions
- Use Biome for formatting and linting (`bun run lint:fix` before commit)
- Co-locate tests with source files
- Follow the project structure conventions in [AGENTS.md](./AGENTS.md)
