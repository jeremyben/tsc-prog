// tslint:disable: no-implicit-dependencies

export * from './module/external'

export { ClassType, GenericDecorator, PromiseLike } from './module/interfaces'
export type KV_1 = { [key: string]: any }

// export { PromiseLike as default } from './module/interfaces'

export * from './module/functions-variables'
export { isAsync as isDeferred } from './module/functions-variables'

import * as classes from './module/classes'
export type repo = classes.UserRepository['user']
// export * from './module/classes'
export type UserC = typeof import('./module/classes').default

export { default } from './module/classes'

import { Myspace, log, MyModule } from './module/namespaces'
export { log as aliasedLog, Myspace as AliasedNamespace, MyModule as AliasedModule }

export * from './module/enums'

import classic = require('./module/export-equals')
// export default classic
export { classic }

// import { DEFAULT_EXTENSIONS } from '@babel/core'
// export default DEFAULT_EXTENSIONS

// export default (arg: string) => {
// 	return arg.toUpperCase()
// }

import { isNumber as yo } from './module/functions-variables'
export { yo }
// export default yo

// export default function aa(arg: string) {
// 	return arg.toUpperCase()
// }
