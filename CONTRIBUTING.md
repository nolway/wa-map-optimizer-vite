# Contributing to wa-map-optimizer-vite

Thank you for your interest in contributing to this plugin! This guide will help you set up your development environment and test your changes.

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/nolway/wa-map-optimizer-vite.git
cd wa-map-optimizer-vite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the plugin

```bash
npm run build
```

This compiles the TypeScript source files from `src/` to `dist/`.

## Development Workflow

### Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Edit the source code in `src/index.ts`

3. Build the plugin to check for TypeScript errors:
   ```bash
   npm run build
   ```

4. Lint and format your code:
   ```bash
   npm run lint
   npm run format
   ```

5. Run the tests:
   ```bash
   npm test
   ```

### Code Quality

Before committing your changes, ensure all checks pass:

- **No TypeScript errors**: `npm run build` completes successfully
- **Linting passes**: `npm run lint` has no errors
- **Code is formatted**: `npm run format` has been run
- **Tests pass**: `npm test` verifies the plugin works correctly

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks (automatically runs lint-staged on commit)
- **Integration tests** in the `test/` directory

## Testing the Plugin

The plugin includes automated integration tests in the `test/` directory.

### Running the Automated Tests

```bash
# Run all tests (builds plugin, runs test build, verifies output)
npm test

# Or manually:
npm run build          # Build the plugin
cd test
npm install           # Install test dependencies
npm run build         # Build test project
npm test              # Verify the output
```

The test suite verifies:
- ✅ Compiled JS files are generated
- ✅ HTML wrapper files are created
- ✅ HTML wrappers include `iframe_api.js`
- ✅ HTML wrappers reference the correct JS files
- ✅ TMJ maps are optimized
- ✅ TMJ script properties point to HTML files
- ✅ Hash matching between JS and HTML files

See `test/README.md` for more details on the test structure.

### Manual Testing Options

Since this is a Vite plugin, you can also test it manually with a real project.

The easiest way to manually test the plugin is with the official WorkAdventure map starter kit, which already has the proper structure and dependencies.

1. **Clone the map-starter-kit** in a separate directory:

```bash
cd ~/projects  # or wherever you keep your projects
git clone https://github.com/workadventure/map-starter-kit.git wa-plugin-test
cd wa-plugin-test
```

2. **Install dependencies**:

```bash
npm install
```

3. **Link your local plugin** (from your plugin development directory):

```bash
# First, create a global link from the plugin directory
cd /path/to/wa-map-optimizer-vite
npm link

# Then, link it in the map-starter-kit
cd ~/projects/wa-plugin-test
npm link wa-map-optimizer-vite
```

4. **Rebuild to test your changes**:

```bash
npm run build
```

5. **Test with the development server**:

```bash
npm run dev
```

Open the provided URL in your browser and verify that:
- The map loads correctly
- Scripts are executed
- The WorkAdventure API is available

### Unlinking When Done

When you're done testing, unlink the plugin:

```bash
cd ~/projects/wa-plugin-test
npm unlink wa-map-optimizer-vite
npm install  # Reinstall the published version
```


### Making Changes and Iterating

When you make changes to the plugin:

1. **Rebuild the plugin**:
   ```bash
   cd /path/to/wa-map-optimizer-vite
   npm run build
   ```

2. **Rebuild the test project**:
   ```bash
   cd ~/projects/wa-plugin-test
   npm run build
   ```

3. **Verify the changes** in `dist/`

**Tip**: Keep two terminal windows open - one in the plugin directory and one in the test project for faster iteration.


## Commit Message Convention

This project follows conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for custom HTML template in wrapper
fix: correct hash extraction regex for script filenames
docs: update CONTRIBUTING.md with map-starter-kit instructions
```
