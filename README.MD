# `tsc-prog`

Build your TypeScript projects programmatically.

## Getting started

```bash
npm i -D tsc-prog
yarn add -D tsc-prog
```

_tsc-prog has no dependency. You just need typescript as a peer dependency._

### You simply need to build 👷‍

Use **`tsc.build`**.

```js
const tsc = require('tsc-prog')

tsc.build({
	basePath: __dirname, // always required
	configFilePath: 'tsconfig.json', // optional if you want to create a compilation object from scratch
	compilerOptions: {
		rootDir: 'src',
		outDir: 'dist',
		declaration: true,
		skipLibCheck: true,
	},
	include: ['src/**/*'],
	exclude: ['**/*.test.ts', '**/*.spec.ts'],
})
```

You can have a look at the parameters **[here](./src/interfaces.ts)**.

### You need more access 👨‍🏭

The `tsc.build` function is made of the two following steps, which you can have access to :

- [Program](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview#data-structures) creation with **`tsc.createProgramFromConfig`**.
- Emitting files from program with **`tsc.emit`**.

```js
const tsc = require('tsc-prog')

// Create the program
const program = tsc.createProgramFromConfig({
	basePath: process.cwd(),
	configFilePath: 'tsconfig.json',
})

// Do what you want with the program

// Actually compile typescript files
tsc.emit(program, { copyOtherToOutDir: true })
```

## Addons

### Clean 🧹

_Helps to address [this issue](https://github.com/microsoft/TypeScript/issues/16057)._

We frequently need to delete the emitted files from a previous build, so a **`clean`** option recursively removes folders and files :

```js
tsc.build({
	basePath: __dirname,
	configFilePath: 'tsconfig.json',
	clean: ['dist'], // accepts relative paths to `basePath` or absolute paths
})
```

You can also directly specify common targets from your compiler options :

```js
tsc.build({
	basePath: __dirname,
	configFilePath: 'tsconfig.json',
	clean: { outDir: true, declarationDir: true },
})
```

###### Protections

The `clean` option protects you against deleting the following folders :

- the specified `basePath` and all its parents (up to the root folder).
- the current working directory and all its parents (up to the root folder).
- the `rootDir` path if specified in the compiler options and all its parents (up to the root folder).

### Copy non-typescript files 🗂️

_Helps to address [this issue](https://github.com/Microsoft/TypeScript/issues/30835)._

The **`copyOtherToOutDir`** option allows you to copy other files to `outDir` (well it says so) :

```js
tsc.build({
	basePath: __dirname,
	configFilePath: 'tsconfig.json',
	compilerOptions: {
		outDir: 'dist', // must be set
	},
	copyOtherToOutDir: true,
})
```

This option is protected against overriding files emitted by the compiler, like same name `.js` or `.json` files (could happen).
