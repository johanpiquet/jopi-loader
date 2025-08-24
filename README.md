# Jopi Loader

## What is it?

It's a loader, which has two goals:
* Allowing custom imports for node.js and bun.js.
* Offer watcher doing automatic restart on file change and automatic browser refresh.

## Custom imports

### What are custom imports?

With node.js, you can't import a CSS file. Doing this `import "./my-css.scss` throw an error.
It's a matter if you want to do React SSR (Server Side Rendering).

The goal of jopi-loader, is to enable this type of import.
It's doing it by mimicking `Vite.js`, which allows importing CSS / image / ...

* Importing simple css/scss: `import "./my-css.scss`.
* Importing css/scss modules `import style from "style.module.scss`.

* Importing images/text/... :
  * `import serverFilePath from "./my-image.png`.
  * `import asDataUrl from "./my-image.png?inline`.
  * `import asRawText from "./my-text.txt?raw`.

> **Warning** - Importing CSS and image file have different behaviors:
>  * With Vite.js, we get the url.
>  * Here we get the absolute path on the server.
>
> It's why you must add a path-converting step in your code, which is specific to your web-framework technology.

### How to enable it?

The easier way, is to use the command line tools `jopin` (for node) or `jopib` (for bun).

**You use it as a replacement for node / bun.**  
Where you type: `node ./myScript.js`, you will do `jopin ./myScript.js`.

> This tools are compatible with debugging, doing that you can simply change
> the setting of your IDE to use jopin/jopib as a drop-in replacement.
> 
> The linux command `which jopin` give you the installation path.
> 
If you want to manually run the loader, you have to use special node/bun options:
```
node --import jopi-loader ./myScript.js
bun --preload jopi-loader ./myScript.js
```

With bun, you can also use a `bunfig.toml` file.

```toml
preload = ["jopi-loader"]
```

## Typescript config

If you are using TypeScript, you need an extra entry in your `tsconfig.json` file.
This file allows TypeScript to know how to handle these imports.

```json
{
  "compilerOptions": {
    "types": ["@jopi-loader/types"]
  }
}
```

## The 'jopin' command line tools

This tool allows executing node.js or bun.js while preloading 'jopi-loader'.
It'd also automatically enable source change watching, restarting the server when sources are updated,
and a lot of interesting things!

> If you are using bun.js, then it's the tool `jopib`.

### Executing

You need to install the tool globally: `npm install jopi-loader --global`.
Doing it make `jopin` available anywhere on your system.

Once installed, you use it as a drop-in replacement for node.js.
Where you type `node` now you type `jopin'.
The tool is available once the package `jopi-loader` is installed.

### Configuring

Extra sections in `package.json` allows to configure the tool behaviors.

#### Watching dirs

`jopin` automatically watch source change when you are not in production mode.
To disable it:
* You must set the environment variable `NODE_ENV` to value 'production'.
* Or disable it by using the settings in `package.json`.

```json title="Sample package.json"
{
  "scripts": {},
  "dependencies": {},
  "watch": false,   // disable watching
  "watch": true,    // enable it, even if production mode
  "watch": [        // extra directories to watch
    "./www",
    "./res"
  ]
}
```

#### Setting extra preload

This allows to set other library for preloading.
It's mainly used for plugins customizing the behaviors of `jopin`.

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


