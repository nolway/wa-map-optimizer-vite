import fs from "fs";
import path from "path";
import { PluginOption } from "vite";
import type { Plugin } from "vite";
import { optimize } from "wa-map-optimizer";
import { OptimizeOptions } from "wa-map-optimizer/dist/guards/libGuards";
import { isMap } from "wa-map-optimizer/dist/guards/mapGuards";

function getMapsLinks() {
    return fs.readdirSync(".").filter((file) => {
        if (!file.endsWith(".json")) {
            return false;
        }

        const object = JSON.parse(fs.readFileSync(file).toString());
        return isMap.safeParse(object).success;
    });
}

export function getMapsScripts(): { [entryAlias: string]: string } {
    const maps = getMapsLinks();
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

        scripts[scriptName] = scriptProperty.value;
    }

    return scripts;
}

export function getMapsOptimizers(logs = true, distFolder = "dist"): PluginOption[] {
    const maps = getMapsLinks();
    const plugins: PluginOption[] = [];

    for (const map of maps) {
        const mapName = path.parse(map).name;
        plugins.push(
            mapOptimizer(map, distFolder, {
                logs: logs,
                output: {
                    path: distFolder,
                    map: {
                        name: mapName,
                    },
                    tileset: {
                        name: `${mapName}-chunk`,
                        size: {
                            height: 2048,
                            width: 2048,
                        },
                    },
                },
            })
        );
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
        async closeBundle() {
            await optimize(mapPath, optimizeOptions);

            const mapName = path.parse(mapPath).name;
            const optimizedMapFilePath = `${distFolder}/${mapName}.json`;

            const mapFile = await fs.promises.readFile(mapPath);
            const map = isMap.parse(JSON.parse(mapFile.toString()));

            if (!map?.properties) {
                return;
            }

            if (!fs.existsSync(distFolder)) {
                throw new Error(`Cannot find ${distFolder} build folder`);
            }

            const assetsFolder = `${distFolder}/assets`;

            if (!fs.existsSync(assetsFolder)) {
                throw new Error(`Cannot find ${assetsFolder} assets build folder`);
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

            const scriptName = path.parse(scriptProperty.value).name;
            const fileName = fs.readdirSync(assetsFolder).filter((asset) => asset.startsWith(scriptName));

            if (!fileName) {
                throw new Error(`Undefined ${fileName} script file`);
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
