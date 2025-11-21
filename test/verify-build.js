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

    const tmjFiles = fs.readdirSync(mapsDir).filter((f) => f.endsWith(".tmj"));
    if (tmjFiles.length === 0) {
        error("No optimized TMJ files found in dist/maps/");
    } else if (tmjFiles.length < 3) {
        warn(`Expected at least 3 TMJ files, found ${tmjFiles.length}: ${tmjFiles.join(", ")}`);
    } else {
        success(`Found ${tmjFiles.length} optimized TMJ file(s): ${tmjFiles.join(", ")}`);
    }

    // Test 7: Verify TMJ script property points to HTML
    tmjFiles.forEach((tmjFile) => {
        const tmjPath = path.join(mapsDir, tmjFile);
        const tmjContent = JSON.parse(fs.readFileSync(tmjPath, "utf-8"));

        const scriptProp = tmjContent.properties?.find((p) => p.name === "script");
        if (!scriptProp) {
            warn(`${tmjFile} has no script property`);
        } else if (!scriptProp.value.endsWith(".html")) {
            error(`${tmjFile} script property does not point to HTML file: ${scriptProp.value}`);
        } else {
            success(`${tmjFile} script property correctly points to HTML: ${scriptProp.value}`);

            // Verify the referenced HTML file exists
            const htmlRefPath = path.join(mapsDir, scriptProp.value);
            if (!fs.existsSync(htmlRefPath)) {
                error(`Referenced HTML file does not exist: ${htmlRefPath}`);
            }
        }
    });
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
