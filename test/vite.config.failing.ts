import { defineConfig } from "vite";
import { getMaps, getMapsScripts, getMapsOptimizers, type WaMapOptimizerOptions, LogLevel } from "../dist/index.js";

// This config intentionally includes a map that fails to optimize (its tileset
// references a missing image). It is used by verify-failing-build.js to check
// that a single failing map does NOT abort the whole build: every other map is
// still optimized, an aggregated report is printed, and the build exits
// non-zero at the end.
const maps = getMaps("failing-maps");

const optimizeOptions: WaMapOptimizerOptions = {
    logs: LogLevel.VERBOSE,
    playUrl: "https://play.workadventu.re",
};

export default defineConfig({
    build: {
        manifest: true,
        rollupOptions: {
            input: {
                ...getMapsScripts(maps),
            },
        },
    },
    plugins: [...getMapsOptimizers(maps, optimizeOptions)],
});
