import { KV } from './namespaces'
import { ExternalModuleReference } from 'typescript'

/**
 * Defines a JS class type.
 * @typeParam T - type of the instance
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * Defines any type of decorator.
 * @public
 */
export type GenericDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptorOrIndex?: TypedPropertyDescriptor<any> | number
) => any

export interface PromiseLike<T> {
	promise: Promise<T>
}

type Promise<T> = { then: (value: any) => T; catch: (reason: any) => void }

/**
 * User model.
 * @public
 */
export interface User {
	/**
	 * Name of the user.
	 */
	name: string

	/**
	 * Age of the user.
	 */
	age: number

	/**
	 * Gender of the user.
	 * @defaultValue 'M'
	 */
	gender?: 'M' | 'F'

	keyvalue?: KV

	extern?: External
}

type External = ExternalModuleReference

// export type KV = { [key: string]: any }

export interface OtherInterface {
	other: string
	user: User
}
