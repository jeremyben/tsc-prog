# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.3](https://github.com/jeremyben/tsc-prog/compare/v2.0.2...v2.0.3) (2019-10-13)


### Bug Fixes

* expose interfaces ([b3d550d](https://github.com/jeremyben/tsc-prog/commit/b3d550dfd9b93575aa9bc93ddcb8e0190995cad0))
* increase pause on windows platform after clean ([150813b](https://github.com/jeremyben/tsc-prog/commit/150813b1bdf79d0ccf33ce40e9994f3fc0d6af0c))

### [2.0.2](https://github.com/jeremyben/tsc-prog/compare/v2.0.1...v2.0.2) (2019-08-15)


### Bug Fixes

* do not copy declarationDir into outDir ([06de1a1](https://github.com/jeremyben/tsc-prog/commit/06de1a1))



### [2.0.1](https://github.com/jeremyben/tsc-prog/compare/v2.0.0...v2.0.1) (2019-08-06)


### Bug Fixes

* outDir was recursively copied into itself ([4b9550c](https://github.com/jeremyben/tsc-prog/commit/4b9550c))



## [2.0.0](https://github.com/jeremyben/tsc-prog/compare/v1.3.0...v2.0.0) (2019-07-26)


### Bug Fixes

* use pretty compiler option for diagnostics ([3c8db99](https://github.com/jeremyben/tsc-prog/commit/3c8db99))


### BREAKING CHANGES

* betterDiagnostics option has been removed



## [1.3.0](https://github.com/jeremyben/tsc-prog/compare/v1.2.2...v1.3.0) (2019-07-26)


### Bug Fixes

* pause on windows after cleaning to help with file handles ([584c0c3](https://github.com/jeremyben/tsc-prog/commit/584c0c3))
* show some colors in logs ([06d8bbd](https://github.com/jeremyben/tsc-prog/commit/06d8bbd))


### Features

* copy non typescript files to outdir ([332f0f0](https://github.com/jeremyben/tsc-prog/commit/332f0f0))



### [1.2.2](https://github.com/jeremyben/tsc-prog/compare/v1.2.1...v1.2.2) (2019-07-22)


### Bug Fixes

* compiler list files options (pre-compile and emitted) ([e882ef8](https://github.com/jeremyben/tsc-prog/commit/e882ef8))
* protect parents of rootDir in clean option ([c7131f5](https://github.com/jeremyben/tsc-prog/commit/c7131f5))



### [1.2.1](https://github.com/jeremyben/tsc-prog/compare/v1.2.0...v1.2.1) (2019-07-21)


### Bug Fixes

* use compiler options from tsconfig.json schema, not ts module ([c651fcc](https://github.com/jeremyben/tsc-prog/commit/c651fcc))



## [1.2.0](https://github.com/jeremyben/tsc-prog/compare/v1.1.0...v1.2.0) (2019-07-20)


### Bug Fixes

* correctly assign compiler options with the right interfaces from ts module ([5e09382](https://github.com/jeremyben/tsc-prog/commit/5e09382))


### Features

* clean option is protected against deleting sensitive folders ([cba911d](https://github.com/jeremyben/tsc-prog/commit/cba911d))



## [1.1.0](https://github.com/jeremyben/tsc-prog/compare/v1.0.0...v1.1.0) (2019-07-17)


### Features

* option to recursively clean files and folders before emitting ([9d406b8](https://github.com/jeremyben/tsc-prog/commit/9d406b8))



## 1.0.0 (2019-07-17)


### Features

* program creation, files emitting, diagnostics logging and formatting ([a27dc50](https://github.com/jeremyben/tsc-prog/commit/a27dc50))
