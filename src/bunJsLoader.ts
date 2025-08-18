import cssModuleCompiler from "./cssModuleCompiler.ts";

// https://bun.com/docs/runtime/plugins

export default function installBunJsLoader() {
    Bun.plugin({
        name: "jopi-loader",
        setup(build) {
            build.onLoad({filter: /\.(css|scss)$/}, cssHandler);
        },
    });
}

const cssHandler: Bun.OnLoadCallback = async ({path}) => {
    if (path.endsWith(".module.css") || (path.endsWith(".module.scss"))) {
        const jsSource = await cssModuleCompiler(path);

        return {
            contents: jsSource,
            loader: "js",
        };
    } else {
        let jsSource = `
const __PATH__ = ${JSON.stringify(path)};
if (global.jopiOnCssImported) global.jopiOnCssImported(__PATH__);
export default __PATH__;
        `
        return {
            contents: jsSource,
            loader: "js",
        };
    }
};