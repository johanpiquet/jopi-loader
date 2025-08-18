export * from "./dist/index.d.ts";
export {cssModuleHandler} from "./dist/esBuildPlugin.js";
export {scssToCss} from "./dist/cssModuleCompiler.js";

// Garde les déclarations globales (ex: *.css, *.scss, etc.)
/// <reference path="./src/extensions.d.ts" />
