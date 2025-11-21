#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const assetsDir = path.join(distDir, "assets");
const mapsDir = path.join(distDir, "maps");

console.log("🧪 Verifying build output...\n");

let errors = 0;
let warnings = 0;

function error(message) {
    console.error(`❌ ERROR: ${message}`);
    errors++;
}

function success(message) {
    console.log(`✅ ${message}`);
}

function warn(message) {
    console.warn(`⚠️  WARNING: ${message}`);
    warnings++;
}

// Test 1: Check dist directory exists
if (!fs.existsSync(distDir)) {
    error("dist/ directory not found");
    process.exit(1);
}
success("dist/ directory exists");

// Test 2: Check assets directory exists
if (!fs.existsSync(assetsDir)) {
    error("dist/assets/ directory not found");
} else {
    success("dist/assets/ directory exists");
}

// Test 3: Check for compiled JS files
const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
if (jsFiles.length === 0) {
    error("No compiled JS files found in dist/assets/");
} else {
    success(`Found ${jsFiles.length} compiled JS file(s): ${jsFiles.join(", ")}`);
}

// Test 4: Check for HTML wrapper files
const htmlFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".html"));
if (htmlFiles.length === 0) {
    error("No HTML wrapper files found in dist/assets/");
} else {
    success(`Found ${htmlFiles.length} HTML wrapper file(s): ${htmlFiles.join(", ")}`);
}

// Test 5: Verify HTML wrapper content
htmlFiles.forEach((htmlFile) => {
    const htmlPath = path.join(assetsDir, htmlFile);
    const htmlContent = fs.readFileSync(htmlPath, "utf-8");

    // Check for iframe_api.js
    if (!htmlContent.includes("iframe_api.js")) {
        error(`${htmlFile} does not include iframe_api.js script`);
    } else {
        success(`${htmlFile} includes iframe_api.js`);
    }

    // Check for play.workadventu.re URL
    if (!htmlContent.includes("https://play.workadventu.re")) {
        warn(`${htmlFile} does not use default play.workadventu.re URL`);
    } else {
        success(`${htmlFile} uses correct Play URL`);
    }

    // Check for corresponding JS file reference
    const scriptName = htmlFile.replace(/\.html$/, "");
    const expectedJsFile = `${scriptName}.js`;
    if (!htmlContent.includes(expectedJsFile)) {
        error(`${htmlFile} does not reference ${expectedJsFile}`);
    } else {
        success(`${htmlFile} correctly references ${expectedJsFile}`);
    }
});

// Test 6: Check for optimized map files
if (!fs.existsSync(mapsDir)) {
    error("dist/maps/ directory not found");
} else {
    success("dist/maps/ directory exists");

    // Recursively find all TMJ files
    function findTmjFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                files.push(...findTmjFiles(fullPath));
            } else if (item.endsWith(".tmj")) {
                files.push(fullPath);
            }
        }
        return files;
    }

    const tmjFilePaths = findTmjFiles(mapsDir);
    if (tmjFilePaths.length === 0) {
        error("No optimized TMJ files found in dist/maps/");
    } else {
        success(`Found ${tmjFilePaths.length} optimized TMJ file(s)`);
    }

    // Test 7: Verify TMJ script property points to HTML
    const scriptReferences = new Map(); // Track script references by map name
    tmjFilePaths.forEach((tmjPath) => {
        const tmjContent = JSON.parse(fs.readFileSync(tmjPath, "utf-8"));
        const relativePath = path.relative(mapsDir, tmjPath);

        const scriptProp = tmjContent.properties?.find((p) => p.name === "script");
        if (!scriptProp) {
            warn(`${relativePath} has no script property`);
        } else if (!scriptProp.value.endsWith(".html")) {
            error(`${relativePath} script property does not point to HTML file: ${scriptProp.value}`);
        } else {
            success(`${relativePath} script property correctly points to HTML: ${scriptProp.value}`);

            // Verify the referenced HTML file exists
            const htmlRefPath = path.join(path.dirname(tmjPath), scriptProp.value);
            if (!fs.existsSync(htmlRefPath)) {
                error(`Referenced HTML file does not exist: ${htmlRefPath}`);
            }

            // Track script references to detect duplicates
            const mapName = path.basename(tmjPath, ".tmj");
            scriptReferences.set(mapName, scriptProp.value);
        }
    });

    // Test 7b: Verify maps with same script name in different directories get unique HTML files
    // but maps pointing to the SAME script file should share the same HTML

    // Check if map1 and map3 share the same script (they both reference map1/scripts/main.ts)
    const map1Script = scriptReferences.get("map1");
    const map3Script = scriptReferences.get("map3");
    if (map1Script && map3Script) {
        if (map1Script === map3Script) {
            success(`map1 and map3 correctly share the same script: ${map1Script}`);
        } else {
            error(`map1 and map3 should share the same script but got:\n  map1: ${map1Script}\n  map3: ${map3Script}`);
        }
    }

    // Verify that map2 has a different script
    const map2Script = scriptReferences.get("map2");
    if (map2Script && map1Script && map2Script === map1Script) {
        error(`map2 should have a different script than map1, but both reference: ${map1Script}`);
    } else if (map2Script && map1Script) {
        success(`map2 correctly has a different script than map1`);
    }
}

// Test 8: Check hash matching between JS and HTML files
jsFiles.forEach((jsFile) => {
    const hashMatch = jsFile.match(/-([a-fA-F0-9]{8})\.js$/);
    if (hashMatch) {
        const hash = hashMatch[1];
        const scriptName = jsFile.replace(/-[a-fA-F0-9]{8}\.js$/, "");
        const expectedHtmlFile = `${scriptName}-${hash}.html`;

        if (htmlFiles.includes(expectedHtmlFile)) {
            success(`Hash matching: ${jsFile} ↔ ${expectedHtmlFile}`);
        } else {
            error(`No matching HTML file for ${jsFile} (expected: ${expectedHtmlFile})`);
        }
    }
});

// Summary
console.log("\n" + "=".repeat(50));
if (errors === 0 && warnings === 0) {
    console.log("🎉 All tests passed!");
    process.exit(0);
} else {
    console.log(`\n📊 Summary: ${errors} error(s), ${warnings} warning(s)`);
    if (errors > 0) {
        console.log("❌ Tests failed");
        process.exit(1);
    } else {
        console.log("⚠️  Tests passed with warnings");
        process.exit(0);
    }
}
