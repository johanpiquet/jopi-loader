# Jopi Loader

## What is it?

It's a loader, which allows coustom imports for types for node.js and bun.js. His main goal is allowing doing React SSR (server side)
with a high libary compatibility.

* For Node.js and bun.js, it allows:
  * Importing css module `import style from "style.module.css`.
  * Importing scss module `import style from "style.module.scss`.

* For Node.js, it allows:
  * Importing CSS, images, font.
  * When imported the value returned is the full path to the resource.
  * Ex: `import cssFilePath from "my-style.css"`.

It's also export a module for EsBuild, to enable css-modules.

## How to use?

The loader needs to be loader before other modules, it's why you need to use a special functionality.

Example for node.js:
```
node --import jopi-loader ./myScript.js
```

Exemple for bun.js:
```
bun --preload jopi-loader ./myScript.js
```

With bun, you can also use a `bunfig.toml` file.

```toml
preload = ["jopi-loader"]
```

See: https://bun.com/docs/runtime/plugins

## Typescript config

If you are using TypeScript, you need an extra entry in your `tsconfig.json` file.
This file allows Typescript to know how to handle this imports.

```json
{
  "compilerOptions": {
    "types": ["jopi-loader"]
  }
}
```

## The 'jopi' command line tools

This tool allows executing node.js or bun.js while preloading 'jopi-loader'
but also the package you set in your `package.json` in the section `preload`.

### Executing

The tool is available once the package `jopi-loader` is installed.

```
npx jopin ./myscript.js
```

or if installed globally:

```
jopin ./myscript.js 
```

> You use it with the same option as what you would do with node.js.
> It's also compatible with WebStorm debugger.

### Setting extra preload

You can use the `preload` section of your `package.json` in order to set extra imports.

```json title="Sample package.json"
{
  "scripts": {},
  "dependencies": {},
  "preload": [
    "my-first-package-to-preload",
    "my-second-package-to-preload"
  ]
}
```

> The package `jopi-rewrite` is always imported if found in your dependencies.

## Using bun.js

The `jopib` tool allows doing the same with bun.js.

```
jopib ./src/index.ts
```