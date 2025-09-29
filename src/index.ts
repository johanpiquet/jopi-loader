import * as NodeModule from 'node:module';

import NodeSpace from "jopi-node-space";
import {installBunJsLoader} from "@jopi-loader/tools";

// Guard to avoid recursive self-registration when using Module.register(import.meta.url)
const __JOPI_LOADER_REGISTERED__ = Symbol.for('jopi-loader:registered');
const __g: any = globalThis as any;

if (!__g[__JOPI_LOADER_REGISTERED__]) {
    __g[__JOPI_LOADER_REGISTERED__] = true;

    if (NodeSpace.what.isNodeJS) {
        // "register" allow async.
        NodeModule.register(new URL('./nodeJsLoader.js', import.meta.url));
    } else if (NodeSpace.what.isBunJs) {
        installBunJsLoader();
    }
}