import { PluginOption } from "vite";
export declare function getMapsScripts(): {
    [entryAlias: string]: string;
};
export declare function getMapsOptimizers(distFolder?: string): PluginOption[];
