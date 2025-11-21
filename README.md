# WA Map Optimizer Vite Plugin

[![Tests](https://github.com/nolway/wa-map-optimizer-vite/actions/workflows/test.yml/badge.svg)](https://github.com/nolway/wa-map-optimizer-vite/actions/workflows/test.yml)

Vite plugin to optimize WorkAdventure Tiled (.tmj) maps using wa-map-optimizer, and to wire Tiled "script" and "mapImage" properties to your built assets automatically.

- Recursively discovers .tmj maps
- Validates map structure (using @workadventure/tiled-map-type-guard)
- Runs wa-map-optimizer during Vite build
- Rewrites the "script" map property to the hashed JS asset built by Vite
- Copies the file referenced by "mapImage" alongside the optimized map and updates the property

## Installation

```bash
npm i -D wa-map-optimizer-vite
```

## Quick start

1) In Tiled, add optional custom properties on your map:

- script (string): relative path to a JS/TS entry you want built by Vite
- mapImage (string): relative path to an image you want copied next to the optimized map

Example (excerpt of your .tmj):

```json
{
  "properties": [
    { "name": "script", "type": "string", "value": "./scripts/myScene.ts" },
    { "name": "mapImage", "type": "string", "value": "./images/preview.png" }
  ]
}
```

2) Configure Vite to discover maps, declare script entries, and attach the optimizer plugins:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { getMaps, getMapsScripts, getMapsOptimizers, type WaMapOptimizerOptions } from 'wa-map-optimizer-vite';

// Discover maps (pass the folder containing your .tmj files)
const maps = getMaps('maps');

// Optional: customize optimizer options (passed to wa-map-optimizer)
const optimizeOptions: WaMapOptimizerOptions = {
  logs: 1, // 0=silent ... 3=verbose (see wa-map-optimizer LogLevel)
  // output: { path: 'dist' } // defaults to 'dist'
  // playUrl: 'https://play.workadventu.re' // defaults to process.env.PLAY_URL or 'https://play.workadventu.re'
  // maxParallelOptimizations: 4 // defaults to number of CPU cores
};

export default defineConfig({
  build: {
    rollupOptions: {
      // Expose each Tiled "script" as a named entry so Vite builds hashed assets
      input: {
        ...getMapsScripts(maps)
      }
    },
    // outDir should match your base output (defaults to 'dist')
    // outDir: 'dist'
  },
  plugins: [
    // One optimizer plugin instance per map
    ...getMapsOptimizers(maps, optimizeOptions)
  ]
});
```

3) Build your project:

```bash
vite build
```

After the build:
- Each map is optimized into dist/<original_map_dir>/<mapName>.tmj
- If a map has a "mapImage" property, the image is copied next to the optimized map and the property is updated
- If a map has a "script" property:
  - The script is compiled into a hashed JS file (e.g., myscript-12345678.js)
  - An HTML wrapper file is generated with the same hash (e.g., myscript-12345678.html) that loads both the WorkAdventure iframe API and the compiled script
  - The "script" property is replaced by the path to the HTML file

## Configuration options

### playUrl

You can configure the WorkAdventure Play URL used in the generated HTML wrapper files in three ways (in order of priority):

1. Pass it in the `WaMapOptimizerOptions`:
```ts
const optimizeOptions: WaMapOptimizerOptions = {
  playUrl: 'https://play.workadventu.re'
};
```

2. Set the `PLAY_URL` environment variable:
```bash
export PLAY_URL=https://play.workadventu.re
vite build
```

3. If neither is set, it defaults to `https://play.workadventu.re`

### maxParallelOptimizations

You can control the maximum number of maps being optimized in parallel to prevent resource exhaustion on limited environments:

```ts
const optimizeOptions: WaMapOptimizerOptions = {
  maxParallelOptimizations: 2 // Limit to 2 concurrent optimizations
};
```

- If not set, it defaults to the number of CPU cores available on your system
- Setting this to `1` will optimize maps sequentially
- This is particularly useful when deploying to CI/CD runners with limited resources

## How it works

- getMaps walks the provided directory (skipping dist and node_modules), validates .tmj files, and returns a Map of path -> ITiledMap
- getMapsScripts returns a Rollup/Vite input object mapping each map script name to its source path
- getMapsOptimizers returns a Vite plugin that processes all maps with controlled concurrency:
  - uses p-limit to control the number of concurrent map optimizations (defaults to CPU count)
  - runs wa-map-optimizer to generate the optimized .tmj and tileset chunks
  - optionally copies the mapImage file next to the optimized map and updates the property
  - reads the built assets folder (dist/assets) to locate the hashed JS for the declared script
  - generates an HTML wrapper file that includes the WorkAdventure iframe API and the compiled script
  - rewrites the map "script" property to point to the HTML wrapper file

Notes:
- The base output folder defaults to dist. You can override via OptimizeOptions.output.path (or WaMapOptimizerOptions.output.path)
- Tileset names are automatically prefixed with <mapName>-chunk and suffixed with a short shake256 digest
- The HTML wrapper uses the `playUrl` option (or PLAY_URL env variable, or defaults to https://play.workadventu.re) for the iframe_api.js script

