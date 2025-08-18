import cssModuleCompiler from "./cssModuleCompiler.ts";

export interface TransformResult {
    text: string;
    type: "js"|"text"
}

export async function transformFile(filePath: string, options: string): Promise<TransformResult> {
    let text: string;

    if (filePath.endsWith(".module.css") || (filePath.endsWith(".module.scss"))) {
        text = await transform_cssModule(filePath);
    } else if (filePath.endsWith(".css") || (filePath.endsWith(".scss"))) {
        text = await transform_css(filePath);
    } else {
        text = await transform_filePath(filePath);
    }

    return {text, type: "js"};
}

async function transform_cssModule(filePath: string) {
    return await cssModuleCompiler(filePath);
}

async function transform_css(filePath: string) {
    return `const __PATH__ = ${JSON.stringify(filePath)};
if (global.jopiOnCssImported) global.jopiOnCssImported(__PATH__);
export default __PATH__;`
}

async function transform_filePath(filePath: string) {
    return `const __PATH__ = ${JSON.stringify(filePath)}; export default __PATH__;`;
}