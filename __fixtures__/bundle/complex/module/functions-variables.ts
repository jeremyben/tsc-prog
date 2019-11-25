// tslint:disable: prefer-const no-var-keyword one-variable-per-declaration only-arrow-functions
import { User } from './interfaces'

/**
 * @internal
 */
const isFunction = (obj: any) => {
	return typeof obj === 'function'
}

/**
 * @internal
 */
function isObject(obj: any) {
	return typeof obj === 'object'
}

/**
 * Checks if given object is Promise-like.
 * @deprecated use isAsync
 */
export function isPromise(obj: any): obj is Promise<any> {
	return obj != null && isObject(obj) && isFunction(obj.then)
}

export { isPromise as isAsync }

type KV = {
	first: 'first'
	[key: string]: string
}

/**
 * Checks if given object is Observable-like.
 * @see https://github.com/ReactiveX/rxjs/blob/master/src/internal/util/isObservable.ts
 * @internal
 */
export const isObservable: (obj: KV) => boolean = (obj) => {
	return !!obj && isFunction(obj.lift) && isFunction(obj.subscribe)
}

export const isObs = isObservable

/**
 * @internal
 */
const isNumber = function(obj: any) {
	return typeof obj === 'number'
}

/**
 * @public
 */
function getUser<T extends KV['first']>(firstname: string | User): User {
	return {
		name: typeof firstname === 'string' ? firstname : firstname.name,
		age: 1,
		gender: 'F',
	}
}

export { isNumber, getUser }

/**
 * Best number in the world
 * @beta
 */
let three = 3,
	four = () => 4,
	five = 5

export { three, four as quatro, four as number4 }

/**
 * Best name in the world.
 * It' true.
 * @alpha
 */
export var name = 'Jeremy'
export type name = 'Jeremy'

/**
 * @decorator
 * @public
 */
export function OverloadedDecorator(...args: Parameters<ParameterDecorator>): void

export function OverloadedDecorator(): ParameterDecorator

export function OverloadedDecorator(): ParameterDecorator {
	return (target, methodKey, index) => undefined
}

export { jsonFixture as fixture } from '../data.json'
// import { jsonFixture as fixture } from '../data.json'
// export { fixture }
import * as jsonFile from '../data.json'
export { jsonFile }
