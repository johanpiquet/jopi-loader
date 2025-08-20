import * as NodeModule from 'node:module';
import "jopi-node-space";
import { doNodeJsLoad, doNodeJsResolve } from "@jopi-loader/tools";
// Guard to avoid recursive self-registration when using Module.register(import.meta.url)
const __JOPI_LOADER_REGISTERED__ = Symbol.for('jopi-loader:registered');
const __g = globalThis;
if (!__g[__JOPI_LOADER_REGISTERED__]) {
    __g[__JOPI_LOADER_REGISTERED__] = true;
    // "register" allow async.
    NodeModule.register(import.meta.url);
}
export async function resolve(specifier, context, nextResolve) {
    return doNodeJsResolve(specifier, context, nextResolve);
}
// noinspection JSUnusedGlobalSymbols
export async function load(url, context, nextLoad) {
    return doNodeJsLoad(url, context, nextLoad);
}
//# sourceMappingURL=nodeJsLoader.js.map