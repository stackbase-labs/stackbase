# GitHub Workflows

This directory contains GitHub Actions workflows for the monorepo project. Each workflow serves a specific purpose in the CI/CD pipeline.

## Workflows Overview

### CI (`ci.yml`)

**Triggers:** Push to `main`/`dev`, Pull Requests
**Purpose:** Continuous Integration pipeline that runs on every code change

#### Jobs

- **Lint**: Runs ESLint across all packages
- **Type Check**: Validates TypeScript types
- **Test**: Runs unit tests with coverage reporting
- **Build**: Builds all packages and applications
- **Format Check**: Ensures code formatting consistency
