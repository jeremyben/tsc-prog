# tsc-prog

Build your TypeScript projects programmatically.

## Get started

```bash
npm i -D tsc-prog
yarn add -D tsc-prog
```

_Tsc-prog has no dependency. You just need typescript as a peer dependency._

## Usage

### You simply need to build

Use **`tsc.build`**.

```js
const tsc = require('tsc-prog')

tsc.build({
    basePath: __dirname,
    configFilePath: 'tsconfig.json',
    compilerOptions: {
        rootDir: 'src',
		outDir: 'dist',
		declaration: true,
		skipLibCheck: true,
    },
    include: ['src/**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.spec.ts']
})
```

You can have a look at the parameters **[here](./src/interfaces.ts)**.

### You need more access

The `tsc.build` function is made of the two following steps, which you can have access to :

- [Program](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview#data-structures) creation with **`tsc.createProgramFromConfig`**.
- Emitting files from program with **`tsc.emit`**.

```js
const tsc = require('tsc-prog')

// Create the program
const program = tsc.createProgramFromConfig({
    basePath: process.cwd(),
    configFilePath: 'tsconfig.json'
})

// Do what you want with the program

// Actually compile typescript files
tsc.emit(program, { betterDiagnostics: true })
```
