import { PluginOption } from "vite";
import { OptimizeOptions } from "wa-map-optimizer/dist/guards/libGuards";
export declare function getMapsScripts(mapDirectory?: string): {
    [entryAlias: string]: string;
};
export declare function getMapsOptimizers(options?: OptimizeOptions, mapDirectory?: string): PluginOption[];
