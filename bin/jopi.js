#!/usr/bin/env node

import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

function printUsageAndExit() {
  console.error('Usage: jopin <script.{ts,tsx,js,mjs,cjs}> [-- <args...>]');
  process.exit(1);
}

function findExecutable(cmd) {
  // On Unix, rely on PATH; on Windows, append .cmd/.exe for Bun.
  if (process.platform === 'win32') {
    const exts = process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'];
    const paths = (process.env.PATH || '').split(path.delimiter);
    for (const p of paths) {
      for (const ext of exts) {
        const full = path.join(p, cmd + ext.toLowerCase());
        if (fs.existsSync(full)) return full;
        const fullUpper = path.join(p, cmd + ext);
        if (fs.existsSync(fullUpper)) return fullUpper;
      }
    }
  }

  return cmd; // Let spawn resolve
}

function run() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    printUsageAndExit();
  }

  // Support a "--" separator between script and its args, but also accept without it
  let scriptPath = argv[0];
  let scriptIndex = 0;

  // If first arg is an option, it's an error for our simple runner
  if (scriptPath.startsWith('-')) {
    printUsageAndExit();
  }

  // Resolve to an absolute path for clarity; do not check existence here to allow Node/Bun to error consistently
  const absScript = path.isAbsolute(scriptPath) ? scriptPath : path.resolve(process.cwd(), scriptPath);
  const ext = path.extname(absScript).toLowerCase();

  // Remaining args
  let rest = argv.slice(scriptIndex + 1);

  // Decide runtime
  const isTs = ext === '.ts' || ext === '.tsx';
  let cmd;
  let args;

  if (isTs) {
    // Prefer Bun for TypeScript, using the jopi-loader as a preload plugin
    cmd = findExecutable('bun');
    args = ['--preload', 'jopi-loader', absScript, ...rest];
  } else {
    // Use Node for JS, ensuring the loader is imported
    cmd = process.execPath; // Node executable
    args = ['--import', 'jopi-loader', absScript, ...rest];
  }

  const child = spawn(cmd, args, { stdio: 'inherit' });

  child.on('exit', (code, signal) => {
    if (signal) {
      // Forward signal-based termination
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on('error', (err) => {
    if (isTs) {
      console.error('Failed to start Bun. Make sure Bun is installed: https://bun.sh');
    }
    console.error(err.message || String(err));
    process.exit(1);
  });
}

run();
