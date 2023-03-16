"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapsOptimizers = exports.getMapsScripts = exports.getMaps = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const wa_map_optimizer_1 = require("wa-map-optimizer");
const crypto_1 = __importDefault(require("crypto"));
const tiled_map_type_guard_1 = require("@workadventure/tiled-map-type-guard");
function getMaps(mapDirectory = ".") {
    let mapFiles = new Map();
    for (const file of fs_1.default.readdirSync(mapDirectory)) {
        const fullPath = mapDirectory + "/" + file;
        if (mapDirectory && fs_1.default.lstatSync(fullPath).isDirectory() && file !== "dist" && file !== "node_modules") {
            mapFiles = new Map([...mapFiles, ...getMaps(fullPath)]);
        }
        else {
            const map = isMapFile(fullPath);
            if (!map) {
                continue;
            }
            mapFiles.set(fullPath, map);
        }
    }
    return mapFiles;
}
exports.getMaps = getMaps;
function isMapFile(filePath) {
    if (!filePath.endsWith(".tmj")) {
        return undefined;
    }
    const object = JSON.parse(fs_1.default.readFileSync(filePath).toString());
    const mapFile = tiled_map_type_guard_1.ITiledMap.safeParse(object);
    return mapFile.success ? mapFile.data : undefined;
}
function getMapsScripts(maps) {
    const scripts = {};
    for (const [mapPath, map] of maps) {
        if (!map.properties) {
            continue;
        }
        const scriptProperty = map.properties.find((property) => property.name === "script");
        if (!scriptProperty || typeof scriptProperty.value !== "string") {
            continue;
        }
        const scriptName = path_1.default.parse(scriptProperty.value).name;
        scripts[scriptName] = path_1.default.resolve(path_1.default.dirname(mapPath), scriptProperty.value);
    }
    return scripts;
}
exports.getMapsScripts = getMapsScripts;
function getMapsOptimizers(maps, options) {
    const plugins = [];
    const baseDistPath = options?.output?.path ?? "dist";
    for (const [mapPath, map] of maps) {
        const parsedMapPath = path_1.default.parse(mapPath);
        const mapName = parsedMapPath.name;
        const mapDirectory = parsedMapPath.dir;
        const distFolder = path_1.default.join(baseDistPath, mapDirectory);
        const optionsParsed = {
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
        optionsParsed.output.tileset.suffix = crypto_1.default
            .createHash("shake256", { outputLength: 4 })
            .update(Date.now() + mapName)
            .digest("hex");
        plugins.push(mapOptimizer(mapPath, map, distFolder, optionsParsed, baseDistPath));
    }
    return plugins;
}
exports.getMapsOptimizers = getMapsOptimizers;
// Map Optimizer Vite Plugin
function mapOptimizer(mapPath, map, distFolder, optimizeOptions, baseDistPath) {
    return {
        name: "map-optimizer",
        load() {
            this.addWatchFile(mapPath);
        },
        async writeBundle() {
            await (0, wa_map_optimizer_1.optimize)(mapPath, optimizeOptions);
            const mapName = path_1.default.parse(mapPath).name;
            const mapExtension = path_1.default.parse(mapPath).ext;
            const optimizedMapFilePath = `${distFolder}/${mapName}${mapExtension}`;
            if (!map?.properties) {
                return;
            }
            if (!fs_1.default.existsSync(distFolder)) {
                throw new Error(`Cannot find ${distFolder} build folder`);
            }
            if (!fs_1.default.existsSync(optimizedMapFilePath)) {
                throw new Error(`Unknown optimized map file on: ${optimizedMapFilePath}`);
            }
            const optimizedMapFile = await fs_1.default.promises.readFile(optimizedMapFilePath);
            const optimizedMap = JSON.parse(optimizedMapFile.toString());
            if (!optimizedMap?.properties) {
                throw new Error("Undefined properties on map optimized! Something was wrong!");
            }
            const imageProperty = map.properties.find((property) => property.name === "mapImage");
            if (imageProperty && typeof imageProperty.value === "string") {
                const imagePath = path_1.default.resolve(path_1.default.dirname(mapPath), imageProperty.value);
                if (fs_1.default.existsSync(imagePath)) {
                    const newMapImageName = `${mapName}${path_1.default.parse(imagePath).ext}`;
                    await fs_1.default.promises.copyFile(imagePath, `${distFolder}/${newMapImageName}`);
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
            if (!fs_1.default.existsSync(assetsFolder)) {
                throw new Error(`Cannot find ${assetsFolder} assets build folder`);
            }
            const scriptName = path_1.default.parse(scriptProperty.value).name;
            const fileName = fs_1.default
                .readdirSync(assetsFolder)
                .find((asset) => asset.match(new RegExp(`^${scriptName}-.*.js$`)));
            if (!fileName) {
                throw new Error(`Undefined ${scriptName} script file`);
            }
            for (const property of optimizedMap.properties) {
                if (property.name === "script") {
                    property.value = path_1.default.relative(distFolder, `${assetsFolder}/${fileName}`);
                    break;
                }
            }
            fs_1.default.promises.mkdir(path_1.default.dirname(optimizedMapFilePath), { recursive: true }).then(() => {
                fs_1.default.promises.writeFile(optimizedMapFilePath, JSON.stringify(optimizedMap));
            });
        },
    };
}
