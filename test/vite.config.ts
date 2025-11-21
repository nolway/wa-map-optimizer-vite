import { defineConfig } from "vite";
import { getMaps, getMapsScripts, getMapsOptimizers, type WaMapOptimizerOptions, LogLevel } from "../dist/index.js";

const maps = getMaps("maps");

const optimizeOptions: WaMapOptimizerOptions = {
    logs: LogLevel.VERBOSE, // Verbose logging for debugging
    playUrl: "https://play.workadventu.re",
    // maxParallelBuilds defaults to number of CPU cores
};

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                ...getMapsScripts(maps),
            },
        },
    },
    plugins: [...getMapsOptimizers(maps, optimizeOptions)],
});
