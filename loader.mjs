import {resolveNodeJsAlias} from "@jopi-loader/tools"

//console.log('⚠️🎉🌟🔥🛑⚠️🚫 loader');

export async function resolve(specifier, context, nextResolve) {
    return resolveNodeJsAlias(specifier, context, nextResolve);
}