import {isFile, searchSourceOf} from "./tools.ts";
import path from "node:path";
import * as sass from "sass";
import fs from "node:fs/promises";
import postcssModules from "postcss-modules";
import postcss from "postcss";

/**
 * Compile a CSS or SCSS file to a JavaScript file.
 */
export default async function compileScss(filePath: string): Promise<string> {
    // Occurs when it's compiled with TypeScript.
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
                generateScopedName: '[name]__[local]',
                localsConvention: 'camelCaseOnly',

                // Allow capturing the class names.
                getJSON: (_cssFileName: string, json: Record<string, string>) => {
                    knownClassNames = json || {};
                }
            })
        ];

        let res = await postcss(plugins).process(css, {from: fromPath, map: false});
        css = res.css;

    } catch (e: any) {
        console.warn("jopi-loader - PostCSS processing failed:", e?.message || e);
        throw e;
    }

    // Here __TOKENS__ contain something like {myLocalStyle: "LocalStyleButton__myLocalStyle___n1l3e"}.
    // The goal is to resolve the computed class name and the original name.

    // To known: we don't execute in the same process as the source code.
    // It's why we can't directly call registerCssModule.

    return `
const __CSS__ = ${JSON.stringify(css)};

let global = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : undefined;

if (typeof global !== "undefined") {
    let onCss = global["jopiloader-oncss"];
    
    if (onCss) onCss(__CSS__); else if (typeof document !== "undefined") {
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.appendChild(document.createTextNode(__CSS__));
      document.head.appendChild(style);
    }
}

export default ${JSON.stringify(knownClassNames)};
`;
}