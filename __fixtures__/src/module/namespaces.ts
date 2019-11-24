import { randomBytes } from 'crypto'
export { randomBytes as randomBytesB }

/**
 * public
 */
export const log: Myspace.logger = (message) => console.log(message)

export type KV = { [k: number]: any }

/**
 * Container namespace
 */
export namespace Myspace {
	/**
	 * @beta
	 */
	export type logger = (message: any) => void

	/**
	 * @alpha
	 */
	export const random = randomBytes(32)
}

/**
 * My module
 * @alpha
 */
// tslint:disable-next-line: no-internal-module
export module MyModule {
	export const obj = { yo: 2 }
}
