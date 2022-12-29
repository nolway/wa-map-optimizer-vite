import fs from "fs";
import path from "path";
import { PluginOption } from "vite";
import type { Plugin } from "vite";
import { optimize } from "wa-map-optimizer";
import { OptimizeOptions } from "wa-map-optimizer/dist/guards/libGuards";
import { isMap } from "wa-map-optimizer/dist/guards/mapGuards";
import crypto from "crypto";

function getMapsLinks(mapDirectory?: string): string[] {
    const mapFiles: string[] = [];

    const baseDir = mapDirectory ?? ".";

    for (const file of fs.readdirSync(baseDir)) {
        const fullPath = baseDir + "/" + file;
        if (mapDirectory && fs.lstatSync(fullPath).isDirectory()) {
            mapFiles.push(...getMapsLinks(fullPath));
        } else {
            if (!isMapFile(fullPath)) {
                continue;
            }
            mapFiles.push(fullPath);
        }
    }

    return mapFiles;
}

function isMapFile(filePath: string): boolean {
    if (!filePath.endsWith(".json") && !filePath.endsWith(".tmj")) {
        return false;
    }

    const object = JSON.parse(fs.readFileSync(filePath).toString());
    return isMap.safeParse(object).success;
}

export function getMapsScripts(mapDirectory?: string): { [entryAlias: string]: string } {
    const maps = getMapsLinks(mapDirectory);
    const scripts: { [entryAlias: string]: string } = {};

    for (const map of maps) {
        const object = JSON.parse(fs.readFileSync(map).toString());
        const mapObject = isMap.parse(object);

        if (!mapObject.properties) {
            continue;
        }

        const scriptProperty = mapObject.properties.find((property) => property.name === "script");

        if (!scriptProperty || typeof scriptProperty.value !== "string") {
            continue;
        }

        const scriptName = path.parse(scriptProperty.value).name;

        scripts[scriptName] = path.resolve(path.dirname(map), scriptProperty.value);
    }

    return scripts;
}

export function getMapsOptimizers(options?: OptimizeOptions, mapDirectory?: string): PluginOption[] {
    const maps = getMapsLinks(mapDirectory);
    const plugins: PluginOption[] = [];
    const distFolder = options?.output?.path ?? "./dist";

    for (const map of maps) {
        const mapName = path.parse(map).name;
        const optionsParsed: OptimizeOptions = options ?? {
            logs: 1,
            output: {
                path: distFolder,
                map: {
                    name: mapName,
                },
                tileset: {
                    size: 1024,
                },
            },
        };

        if (!optionsParsed.output) {
            optionsParsed.output = {};
        }

        if (!optionsParsed.output.tileset) {
            optionsParsed.output.tileset = {};
        }

        optionsParsed.output.tileset.prefix = `${mapName}-chunk`;
        optionsParsed.output.tileset.suffix = crypto
            .createHash("shake256", { outputLength: 4 })
            .update(Date.now() + mapName)
            .digest("hex");

        plugins.push(mapOptimizer(map, distFolder, optionsParsed));
    }

    return plugins;
}

// Map Optimizer Vite Plugin
function mapOptimizer(mapPath: string, distFolder: string, optimizeOptions: OptimizeOptions): Plugin {
    return {
        name: "map-optimizer",
        load() {
            this.addWatchFile(mapPath);
        },
        async writeBundle() {
            await optimize(mapPath, optimizeOptions);

            const mapName = path.parse(mapPath).name;
            const mapExtension = path.parse(mapPath).ext;
            const optimizedMapFilePath = `${distFolder}/${mapName}${mapExtension}`;

            const mapFile = await fs.promises.readFile(mapPath);
            const map = isMap.parse(JSON.parse(mapFile.toString()));

            if (!map?.properties) {
                return;
            }

            if (!fs.existsSync(distFolder)) {
                throw new Error(`Cannot find ${distFolder} build folder`);
            }

            if (!fs.existsSync(optimizedMapFilePath)) {
                throw new Error(`Unknown optimized map file on: ${optimizedMapFilePath}`);
            }

            const optimizedMapFile = await fs.promises.readFile(optimizedMapFilePath);
            const optimizedMap = JSON.parse(optimizedMapFile.toString());

            if (!optimizedMap?.properties) {
                throw new Error("Undefined properties on map optimized! Something was wrong!");
            }

            const imageProperty = map.properties.find((property) => property.name === "mapImage");

            if (imageProperty) {
                if (typeof imageProperty.value === "string" && fs.existsSync(imageProperty.value)) {
                    const newMapImageName = `${mapName}${path.parse(imageProperty.value).ext}`;
                    await fs.promises.copyFile(imageProperty.value, `${distFolder}/${newMapImageName}`);

                    for (const property of optimizedMap.properties) {
                        if (property.name === "mapImage") {
                            property.value = newMapImageName;
                            break;
                        }
                    }
                }
            }

            const scriptProperty = map.properties.find((property) => property.name === "script");

            if (!scriptProperty || typeof scriptProperty.value !== "string") {
                return;
            }

            const assetsFolder = `${distFolder}/assets`;

            if (!fs.existsSync(assetsFolder)) {
                throw new Error(`Cannot find ${assetsFolder} assets build folder`);
            }

            const scriptName = path.parse(scriptProperty.value).name;
            const fileName = fs
                .readdirSync(assetsFolder)
                .find((asset) => asset.match(new RegExp(`^${scriptName}-.*.js$`)));

            if (!fileName) {
                throw new Error(`Undefined ${scriptName} script file`);
            }

            for (const property of optimizedMap.properties) {
                if (property.name === "script") {
                    property.value = `assets/${fileName}`;
                    break;
                }
            }

            await fs.promises.writeFile(optimizedMapFilePath, JSON.stringify(optimizedMap));
        },
    };
}
