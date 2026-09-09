# Contributing to Stackbase

Thanks for taking the time to contribute! This guide explains how to get set up and the workflow we follow.

## Code of Conduct

Be respectful and constructive. We're all here to build something useful together.

## Getting Started

1. **Fork** the repository and clone your fork.
2. Create a branch from `main`:

   ```bash
   git checkout -b feat/my-change
   ```

3. Install dependencies (Node.js 20+ and pnpm 10.32+ required):

   ```bash
   pnpm install
   ```

4. Copy the example environment files (see the [README](./README.md#-quick-start)) and start the dev servers:

   ```bash
   pnpm dev
   ```

## Development Workflow

Before opening a pull request, make sure the following all pass locally:

```bash
pnpm lint          # ESLint
pnpm check-types   # TypeScript
pnpm test          # Vitest
pnpm build         # Ensure everything builds
```

`pnpm format` will apply Prettier formatting. A Husky pre-commit hook runs lint-staged automatically.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(web): add password reset flow
fix(api): handle missing auth header
docs(readme): clarify k8s setup
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.

## Pull Requests

- Keep PRs focused — one logical change per PR.
- Describe **what** changed and **why**.
- Link any related issues (e.g. `Closes #123`).
- Update documentation and tests where relevant.
- Ensure CI is green before requesting review.

## Reporting Bugs & Requesting Features

Use [GitHub Issues](https://github.com/stackbase-labs/stackbase/issues). For open-ended questions or ideas, start a [Discussion](https://github.com/stackbase-labs/stackbase/discussions).

## Security

Please do not report security vulnerabilities through public issues. See [SECURITY.md](./SECURITY.md).

---

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
