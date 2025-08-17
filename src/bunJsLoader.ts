import {cssModuleHandler} from "./esBuildPlugin.ts";

// https://bun.com/docs/runtime/plugins

export default function installBunJsLoader() {
    Bun.plugin({
        name: "jopi-loader",
        setup(build) {
            build.onLoad({filter: /\.(css|scss)$/}, cssModuleHandler);
        },
    });
}