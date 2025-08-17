# Jopi Loader

## What is it?

Its allows doing thing like `import "my-style.css"` with Node.js (server side).

This is part of the Jopi Rewrite project, where we want to be able to do React SSR with Node.js.
The difficulty when doing SSR, it's that React.js doesn't support natively importing styles / images / ... where WebPack like project allows it.

## How to use?

You need to use the `import` functionality of Node.js, which allow this package to be imported and initialized before all other packages.

Exemple:
```
node --import jopi-loader ./myScript.js
```

## Typescript config

If you are using TypeScript, you need an extra entry in your `tsconfig.json` file.

```json
{
  "compilerOptions": {
    "types": ["jopi-loader"]
  }
}
```

