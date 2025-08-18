export * from "./dist/index.d.ts";
export {cssModuleHandler} from "./esBuildPlugin.ts";
export {scssToCss} from "./cssModuleCompiler.ts";

// Garde les déclarations globales (ex: *.css, *.scss, etc.)
/// <reference path="./src/extensions.d.ts" />
