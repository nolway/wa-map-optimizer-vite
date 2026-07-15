#!/usr/bin/env node
// Verifies the "one map fails to optimize" scenario:
//   - a single failing map must NOT abort the whole build,
//   - every other map is still optimized,
//   - an aggregated report is printed,
//   - the build still exits non-zero.
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 Verifying failing-map build scenario...\n");

let errors = 0;

function check(condition, okMessage, koMessage) {
    if (condition) {
        console.log(`✅ ${okMessage}`);
    } else {
        console.error(`❌ ERROR: ${koMessage}`);
        errors++;
    }
}

const viteBin = path.join(__dirname, "node_modules", ".bin", "vite");
const result = spawnSync(viteBin, ["build", "--config", "vite.config.failing.ts"], {
    cwd: __dirname,
    encoding: "utf-8",
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
console.log("----- build output -----");
console.log(output.trim());
console.log("------------------------\n");

// 1. The build must fail (non-zero exit) since one map could not be optimized.
check(
    result.status !== 0,
    "Build exited non-zero as expected",
    `Build should have failed but exited with code ${result.status}`
);

// 2. The aggregated report must be printed.
check(
    output.includes("Map optimization report"),
    "Aggregated optimization report was printed",
    "Aggregated optimization report was not printed"
);

// 3. The report must attribute the failure to the broken map.
check(
    /broken\.tmj/.test(output) && /Undefined tileset file/.test(output),
    "Report attributes the failure to broken.tmj (missing tileset)",
    "Report does not mention broken.tmj / the missing tileset error"
);

// 4. The summary error must report exactly one failed map.
check(
    /Map optimization failed for 1 map\(s\)/.test(output),
    "Summary error reports exactly 1 failed map",
    "Summary error does not report exactly 1 failed map"
);

// 5. Despite the failure, the good map must still have been optimized.
const goodMapOutput = path.join(__dirname, "dist", "failing-maps", "good", "good.tmj");
check(
    fs.existsSync(goodMapOutput),
    "The good map was still optimized (build continued past the failure)",
    `Expected optimized good map at ${goodMapOutput}, but it was not produced`
);

// 6. The broken map must NOT have produced an optimized output.
const brokenMapOutput = path.join(__dirname, "dist", "failing-maps", "broken", "broken.tmj");
check(
    !fs.existsSync(brokenMapOutput),
    "The broken map produced no optimized output, as expected",
    `Broken map unexpectedly produced an output at ${brokenMapOutput}`
);

console.log("\n" + "=".repeat(50));
if (errors === 0) {
    console.log("🎉 Failing-map scenario behaves as expected!");
    process.exit(0);
} else {
    console.log(`\n📊 Summary: ${errors} error(s)`);
    console.log("❌ Failing-map scenario test failed");
    process.exit(1);
}
