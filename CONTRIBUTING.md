# Contributing to Dompet Tenang

Thank you for your interest in contributing to Dompet Tenang! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors and maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Dompet Tenang.git
   cd Dompet Tenang
   ```
3. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Development Setup

### API Development
```bash
cd apps/api
npm install
npm run dev
```

### Web Development
```bash
cd apps/web
npm install
npm run dev
```

### Mobile Development
```bash
cd apps/mobile
npm install
npm start
```

## Making Changes

1. Make your changes in your branch
2. Open a PR into **`develop`** (auto-deploys staging)
3. After QA passes on staging, run Actions → **Promote to Production** (approve environment)
4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add new feature" 
   # or
   git commit -m "fix: resolve issue with X"
   ```

Full branch & release flow: [docs/DEV_WORKFLOW.md](./docs/DEV_WORKFLOW.md).

## Commit Message Format

We follow the Conventional Commits specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without feature/fix changes
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, or tooling changes

Examples:
- `feat: add expense filtering by date range`
- `fix: resolve category selection bug`
- `docs: update API documentation`

## Submitting Changes

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Create a Pull Request on GitHub with:
   - Clear title describing the change
   - Detailed description of what changed and why
   - Reference to any related issues
   - Screenshots/videos if applicable

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Format code with proper indentation (2 spaces)
- Remove unused imports
- Add meaningful comments for complex logic

## Testing

- Add tests for new features
- Ensure all existing tests pass
- Run tests before submitting PR:
  ```bash
  npm run test
  ```

## Pull Request Review

- A maintainer will review your PR
- Address feedback and make requested changes
- Once approved, your PR will be merged

## Questions?

Feel free to open an issue for questions or discussions!

Thank you for contributing! 🎉
