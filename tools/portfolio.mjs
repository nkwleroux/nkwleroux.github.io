#!/usr/bin/env node

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOL_DIR, "..");
const DIST = join(ROOT, "dist");
const CONFIG = join(ROOT, "vite.config.ts");
const TSC = join(ROOT, "node_modules", "typescript", "bin", "tsc");

process.chdir(ROOT);

const command = (process.argv[2] ?? "help").toLowerCase();

function dependencyHint(name) {
  console.error(`\nMissing local dependency: ${name}`);
  console.error("Run 'npm install' in the project root, then try again.\n");
}

async function loadVite() {
  try {
    return await import("vite");
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") {
      dependencyHint("vite");
    }
    throw error;
  }
}

function runTypecheck() {
  if (!existsSync(TSC)) {
    dependencyHint("typescript");
    process.exitCode = 1;
    return false;
  }

  console.log("==> Type checking");
  const result = spawnSync(process.execPath, [TSC, "-p", join(ROOT, "tsconfig.json"), "--noEmit"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }

  return true;
}

async function runBuild() {
  if (!runTypecheck()) {
    throw new Error("TypeScript type checking failed.");
  }

  const { build } = await loadVite();
  console.log("==> Building production site");
  await build({
    root: ROOT,
    configFile: CONFIG,
  });
  console.log(`==> Build complete: ${DIST}`);
}

async function runDev() {
  const { createServer } = await loadVite();
  const server = await createServer({
    root: ROOT,
    configFile: CONFIG,
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
  });

  await server.listen();
  console.log("\nPEN development server");
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
}

async function runPreview() {
  await runBuild();

  const { preview } = await loadVite();
  const server = await preview({
    root: ROOT,
    configFile: CONFIG,
    preview: {
      host: "127.0.0.1",
      port: 4173,
    },
  });

  console.log("\nPEN production preview");
  server.printUrls();
}


function printHelp() {
  console.log(`PEN local tool\n\nUsage:\n  node tools/portfolio.mjs dev\n  node tools/portfolio.mjs build\n  node tools/portfolio.mjs preview\n  node tools/portfolio.mjs typecheck\n\nEquivalent npm commands:\n  npm run dev\n  npm run build\n  npm run preview\n  npm run typecheck`);
}

try {
  switch (command) {
    case "dev":
      await runDev();
      break;
    case "build":
      await runBuild();
      break;
    case "preview":
      await runPreview();
      break;
    case "typecheck":
      if (!runTypecheck()) {
        throw new Error("TypeScript type checking failed.");
      }
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
} catch (error) {
  console.error(`\nPEN ${command} failed:`);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
