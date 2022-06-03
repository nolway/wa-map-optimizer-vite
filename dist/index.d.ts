import { PluginOption } from "vite";
export declare function getMapsScripts(): {
    [entryAlias: string]: string;
};
export declare function getMapsOptimizers(logs?: boolean, distFolder?: string): PluginOption[];
