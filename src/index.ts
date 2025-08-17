import * as NodeModule from 'node:module';

import "jopi-node-space";
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {isFile, searchSourceOf} from "./tools.ts";
import postcss from "postcss";
import * as sass from "sass";
import postcssModules from "postcss-modules"

const extensionForResourceType_nojs = [
    ".css", ".scss",
    ".jpg", ".png", ".jpeg", ".gif", ".svg", ".webp",
    ".avif", ".ico",
    ".woff", ".woff2", ".ttf", ".txt",
];

// Guard to avoid recursive self-registration when using Module.register(import.meta.url)
const __JOPI_LOADER_REGISTERED__ = Symbol.for('jopi-loader:registered');
const __g: any = globalThis as any;

if (!__g[__JOPI_LOADER_REGISTERED__]) {
    __g[__JOPI_LOADER_REGISTERED__] = true;

    // "register" allow async.
    NodeModule.register(import.meta.url as unknown as string);
}

export async function resolve(specifier: string, context: any, nextResolve: any) {
    async function tryResolveFile(filePath: string, moduleName: string) {
        if (await isFile(filePath)) {
            return nextResolve(moduleName, context);
        }
        return undefined;
    }

    async function tryResolveDirectory(url: string) {
        const basePath = fileURLToPath(url);
        let basename = path.basename(basePath);

        let allFilesToTry = ["index.js", basename + ".cjs.js", basename + ".js"];

        for (let fileToTry of allFilesToTry) {
            const res = await tryResolveFile(path.join(basePath, fileToTry), specifier + "/" + fileToTry);
            if (res) {
                return res;
            }
        }
        // Will throw an error.
        return nextResolve(specifier, context);
    }

    async function tryResolveModule(url: string) {
        const basePath = fileURLToPath(url);

        const res = await tryResolveFile(basePath + ".js", specifier + ".js");
        if (res) {
            return res;
        }

        // Will throw an error.
        return nextResolve(specifier, context);
    }

    const specifierExt = path.extname(specifier);

    if (extensionForResourceType_nojs.includes(specifierExt)) {
        let format = "jopi-loader";
        if ((specifierExt === ".css") || (specifierExt === ".scss")) format += "-css";

        console.log("⚠️ jopi-loader found: ", specifier, "format is", format);

        return {
            url: new URL(specifier, context.parentURL).href,
            format: format,
            shortCircuit: true
        };
    }

    try {
        return nextResolve(specifier, context);
    } catch (e: any) {
        if (e.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
            return await tryResolveDirectory(e.url! as string);
        }
        if (e.code === "ERR_MODULE_NOT_FOUND") {
            return await tryResolveModule(e.url! as string);
        }
        throw e;
    }
}

// noinspection JSUnusedGlobalSymbols
export async function load(url: string, context: any, nextLoad: any) {
    if (context.format?.startsWith("jopi-loader")) {
        if (context.format === 'jopi-loader') {
            return {
                source: 'export default {};',
                format: 'module',
                shortCircuit: true
            };
        } else if (context.format === 'jopi-loader-css') {
            //console.log("⚠️ jopi-loader format: ", context.format);

            return await compileScss(fileURLToPath(url));
        }
    }

    return nextLoad(url, context);
}

/**
 * Compile a CSS ou SCSS file to a JavaScript file.
 */
async function compileScss(filePath: string) {
    // If the built JS references a CSS/SCSS that lives in src, remap to source
    if (!await isFile(filePath)) {
        filePath = await searchSourceOf(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();

    let css: string;
    let fromPath = filePath;

    if (ext === ".scss") {
        // Compile SCSS to CSS
        const res = sass.compile(filePath, { style: 'expanded' });
        css = res.css.toString();
        fromPath = filePath.replace(/\.scss$/i, '.css');
    } else {
        css = await fs.readFile(filePath, 'utf-8');
    }

    // Process with PostCSS and css-modules
    let knownClassNames: Record<string, string> = {};

    try {
        const plugins = [
            postcssModules({
                // The format of the classnames.
                generateScopedName: '[name]__[local]___[hash:base64:5]',
                localsConvention: 'camelCaseOnly',

                // Allow capturing the class names.
                getJSON: (_cssFileName: string, json: Record<string, string>) => {
                    knownClassNames = json || {};
                }
            })
        ];

        const result = await postcss(plugins).process(css, {from: fromPath, map: false});
        css = result.css;
    } catch (e: any) {
        console.warn("jopi-loader - PostCSS processing failed:", e?.message || e);
        throw e;
    }

    // Here __TOKENS__ contain something like {myLocalStyle: "LocalStyleButton__myLocalStyle___n1l3e"}.
    // The goal is to resolve the computed class name and the original name.

    const jsSource = `
const __CSS__ = ${JSON.stringify(css)};
const __TOKENS__ = ${JSON.stringify(knownClassNames)};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.appendChild(document.createTextNode(__CSS__));
  document.head.appendChild(style);
}
export default __TOKENS__;
`;

    return {
        source: jsSource,
        format: 'module',
        shortCircuit: true
    };
}