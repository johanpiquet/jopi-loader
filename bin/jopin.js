#!/usr/bin/env node

import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// ***************************************************
const TOOL = "node";
const FLAG = "--import"
// ***************************************************

const VERSION = "v1.1.1"
const FORCE_LOG = false;
const LOG = process.env.JOPI_LOG || FORCE_LOG;

if (LOG) console.log("Jopi version:", VERSION);

function getRelativePath(absolutePath) {
  return path.relative(process.cwd(), absolutePath);
}

function findPackageEntry(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');

  // >>> Try to take the "main" information inside the package.json.

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      if (packageJson.main) {
        const mainPath = path.join(packagePath, packageJson.main);
        if (fs.existsSync(mainPath)) return mainPath;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // >>> "main" not set? Try commun path.

  const commonPaths = [
    'dist/index.js',
    'lib/index.js',
    'src/index.js',
    'index.js'
  ];

  for (const commonPath of commonPaths) {
    const fullPath = path.join(packagePath, commonPath);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  // Default to dist/index.js
  return path.join(packagePath, 'dist/index.js');
}

function findNodePackage(packageName) {
  let currentDir = process.cwd();

  while (true) {
    const packagePath = path.join(currentDir, 'node_modules', packageName);

    if (fs.existsSync(packagePath)) {
      return packagePath;
    }

    const parentDir = path.dirname(currentDir);

    // Reached root directory
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return null;
}


function findPackageJson() {
  let currentDir = process.cwd();

  while (true) {
    const packagePath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packagePath)) return packagePath;

    const parentDir = path.dirname(currentDir);

    // Reached root directory
    if (parentDir === currentDir) break;

    currentDir = parentDir;
  }

  return null;
}

const knowPackagesToPreload = ["jopi-rewrite"];

function addKnownPackages(toPreload, toSearch) {
  if (!toSearch) return;

  for (const key in toSearch) {
    if (knowPackagesToPreload.includes(key)) {
      toPreload.push(key);
    }
  }
}

function getPreloadModules() {
  const packageJsonPath = findPackageJson();

  if (!packageJsonPath) {
    return [];
  }

  try {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);

    let toPreload = [];

    if (packageData.preload) {
      if (Array.isArray(packageData.preload)) {
        toPreload = [...toPreload, ...packageData.preload];
      }
    }

    addKnownPackages(toPreload, packageData["devDependencies"]);
    addKnownPackages(toPreload, packageData["dependencies"]);

    return toPreload;

  } catch {
    // Ignore parsing errors and continue without preload modules.
    return [];
  }
}

function findExecutable(cmd) {
  const paths = (process.env.PATH || '').split(path.delimiter);

  if (process.platform === 'win32') {
    const exts = process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'];

    for (const p of paths) {
      for (const ext of exts) {
        const full = path.join(p, cmd + ext.toLowerCase());
        if (fs.existsSync(full)) return full;

        const fullUpper = path.join(p, cmd + ext);
        if (fs.existsSync(fullUpper)) return fullUpper;
      }
    }
  } else {
    for (const p of paths) {
      const full = path.join(p, cmd);
      if (fs.existsSync(full)) return full;

      const fullUpper = path.join(p, cmd);
      if (fs.existsSync(fullUpper)) return fullUpper;
    }
  }

  // Let spawn resolve
  return cmd;
}

function run() {
  // Here first is node, second is jopi. (it's du to shebang usage).
  const argv = process.argv.slice(2);

  let toPreload = getPreloadModules();
  toPreload = ["jopi-loader", ...toPreload];

  let preloadArgs = [];

  // We need the absolute path.
  toPreload.forEach(pkg => {
    const pkgPath = findNodePackage(pkg);
    if (!pkgPath) return;

    let foundPath = getRelativePath(findPackageEntry(pkgPath));

    if (foundPath) {
      preloadArgs.push(FLAG);
      preloadArgs.push(foundPath);
    }
  });

  let cmd = findExecutable(TOOL);
  if (LOG) console.log("Jopi - Using " + TOOL + " from:", cmd);
  let args = [...preloadArgs, ...argv];

  if (LOG) console.log("Jopi - Executing:", cmd, ...args);
  const child = spawn(cmd, args, { stdio: 'inherit' });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error(err.message || String(err));
    process.exit(1);
  });
}

run();
