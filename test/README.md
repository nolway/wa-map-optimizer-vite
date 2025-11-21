# Test Directory

This directory contains integration tests for the wa-map-optimizer-vite plugin.

## Structure

```
test/
├── package.json          # Test project dependencies
├── vite.config.ts        # Vite configuration using the plugin
├── verify-build.js       # Automated test script
├── README.md             # This file
└── maps/
    ├── test.tmj          # Test TMJ map file
    ├── tileset.tsj       # Test tileset
    └── scripts/
        └── main.ts       # Test script to be compiled
```

## Running Tests

### Prerequisites

First, build the plugin:

```bash
cd ..
npm run build
```

### Install Test Dependencies

```bash
cd test
npm install
```

### Run the Build

```bash
npm run build
```

### Verify the Build

```bash
npm test
```

This will run `verify-build.js` which checks:

1. ✅ Dist directory structure
2. ✅ Compiled JS files exist
3. ✅ HTML wrapper files are generated
4. ✅ HTML wrappers include `iframe_api.js`
5. ✅ HTML wrappers reference correct JS files
6. ✅ Optimized TMJ files exist
7. ✅ TMJ script properties point to HTML files
8. ✅ Hash matching between JS and HTML files

## Manual Inspection

After building, inspect the generated files:

```bash
# List all generated assets
ls -la dist/assets/

# View HTML wrapper content
cat dist/assets/main-*.html

# View optimized map
cat dist/maps/test.tmj | jq '.properties'
```

## Testing Different Configurations

### Test with Custom playUrl

Edit `vite.config.ts`:

```typescript
const optimizeOptions: WaMapOptimizerOptions = {
  playUrl: 'https://play.staging.workadventu.re'
};
```

Then rebuild and verify the HTML contains the custom URL.

### Test with Environment Variable

```bash
PLAY_URL=https://custom.example.com npm run build
npm test
```

## Adding More Test Cases

To add more test scenarios:

1. Create additional TMJ files in `maps/`
2. Create corresponding scripts in `maps/scripts/`
3. Update the script properties in the TMJ files
4. Run `npm run build` and `npm test`

## Expected Output

After a successful build, you should see:

```
dist/
├── assets/
│   ├── main-XXXXXXXX.js      # Compiled script
│   └── main-XXXXXXXX.html    # HTML wrapper
└── maps/
    ├── test.tmj               # Optimized map
    └── test-chunk-XXXX.tsj    # Optimized tileset chunk
```

The `test.tmj` file should have its `script` property pointing to `../assets/main-XXXXXXXX.html`.
