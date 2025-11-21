import fs from "fs";
import path from "path";
import { PluginOption } from "vite";
import type { Plugin } from "vite";
import { optimize } from "wa-map-optimizer";
import crypto from "crypto";
import { ITiledMap } from "@workadventure/tiled-map-type-guard";
import { OptimizeOptions } from "wa-map-optimizer/dist/guards/libGuards.js";
export { OptimizeOptions, LogLevel } from "wa-map-optimizer/dist/guards/libGuards.js";

export type WaMapOptimizerOptions = {
    playUrl?: string;
} & OptimizeOptions

export function getMaps(mapDirectory = "."): Map<string, ITiledMap> {
    let mapFiles = new Map<string, ITiledMap>();

    for (const file of fs.readdirSync(mapDirectory)) {
        const fullPath = mapDirectory + "/" + file;
        if (mapDirectory && fs.lstatSync(fullPath).isDirectory() && file !== "dist" && file !== "node_modules") {
            mapFiles = new Map([...mapFiles, ...getMaps(fullPath)]);
        } else {
            const map = isMapFile(fullPath);
            if (!map) {
                continue;
            }
            mapFiles.set(fullPath, map);
        }
    }

    return mapFiles;
}

function isMapFile(filePath: string): ITiledMap | undefined {
    if (!filePath.endsWith(".tmj")) {
        return undefined;
    }

    let object = undefined;

    try {
        object = JSON.parse(fs.readFileSync(filePath).toString());
    } catch (error) {
        throw new Error(`Error on ${filePath} map file: ${error}`);
    }

    const mapFile = ITiledMap.safeParse(object);

    if (!mapFile.success) {
        console.error(`${filePath} is not a compatible map file, the file will be skip`);
        console.error(JSON.stringify(mapFile.error.issues));
        return undefined;
    }

    return mapFile.data;
}

export function getMapsScripts(maps: Map<string, ITiledMap>): { [entryAlias: string]: string } {
    const scripts: { [entryAlias: string]: string } = {};

    for (const [mapPath, map] of maps) {
        if (!map.properties) {
            continue;
        }

        const scriptProperty = map.properties.find((property) => property.name === "script");

        if (!scriptProperty || typeof scriptProperty.value !== "string") {
            continue;
        }

        const scriptName = path.parse(scriptProperty.value).name;

        scripts[scriptName] = path.resolve(path.dirname(mapPath), scriptProperty.value);
    }

    return scripts;
}

export function getMapsOptimizers(maps: Map<string, ITiledMap>, options?: WaMapOptimizerOptions): PluginOption[] {
    const plugins: PluginOption[] = [];
    const baseDistPath = options?.output?.path ?? "dist";
    const playUrl = options?.playUrl ?? process.env.PLAY_URL ?? "https://play.workadventu.re";

    for (const [mapPath, map] of maps) {
        const parsedMapPath = path.parse(mapPath);
        const mapName = parsedMapPath.name;
        const mapDirectory = parsedMapPath.dir;

        const distFolder = path.join(baseDistPath, mapDirectory);

        const optionsParsed: OptimizeOptions = {
            logs: 1,
            output: {
                path: distFolder,
                map: {
                    name: mapName,
                },
            },
            ...options,
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

        plugins.push(mapOptimizer(mapPath, map, distFolder, structuredClone(optionsParsed), baseDistPath, playUrl));
    }

    return plugins;
}

// Map Optimizer Vite Plugin
function mapOptimizer(
    mapPath: string,
    map: ITiledMap,
    distFolder: string,
    optimizeOptions: OptimizeOptions,
    baseDistPath: string,
    playUrl: string
): Plugin {
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

            if (imageProperty && typeof imageProperty.value === "string" && imageProperty.value !== "") {
                const imagePath = path.resolve(path.dirname(mapPath), imageProperty.value);

                if (fs.existsSync(imagePath)) {
                    const newMapImageName = `${mapName}${path.parse(imagePath).ext}`;
                    await fs.promises.copyFile(imagePath, `${distFolder}/${newMapImageName}`);

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

            const assetsFolder = `${baseDistPath}/assets`;

            if (!fs.existsSync(assetsFolder)) {
                throw new Error(`Cannot find ${assetsFolder} assets build folder`);
            }

            const scriptName = path.parse(scriptProperty.value).name;
            const fileName = fs
                .readdirSync(assetsFolder)
                .find((asset) => asset.match(new RegExp(`^${scriptName}-[a-fA-F0-9]{8}\\.js$`)));

            if (!fileName) {
                throw new Error(`Undefined ${scriptName} script file`);
            }

            // Extract the hash from the compiled JS filename
            const hashMatch = fileName.match(/-([a-fA-F0-9]{8})\.js$/);
            if (!hashMatch) {
                throw new Error(`Cannot extract hash from ${fileName}`);
            }
            const hash = hashMatch[1];

            // Generate HTML wrapper file
            const htmlFileName = `${scriptName}-${hash}.html`;
            const htmlFilePath = `${assetsFolder}/${htmlFileName}`;
            const jsRelativePath = `./${fileName}`;

            const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <script src="${playUrl}/iframe_api.js"></script>
    <script src="${jsRelativePath}"></script>
  </head>
  <body>

  </body>
</html>`;

            await fs.promises.writeFile(htmlFilePath, htmlContent);

            for (const property of optimizedMap.properties) {
                if (property.name === "script") {
                    property.value = path.relative(distFolder, `${assetsFolder}/${htmlFileName}`);
                    break;
                }
            }

            await fs.promises.mkdir(path.dirname(optimizedMapFilePath), { recursive: true }).then(() => {
                fs.promises.writeFile(optimizedMapFilePath, JSON.stringify(optimizedMap));
            });
        },
    };
}
