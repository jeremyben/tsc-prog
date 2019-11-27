/**
 * Not the global Promise.
 */
export type Promise = { then: (value: any) => any; catch: (reason: any) => void }

export function isMyPromise(obj: any): obj is Promise {
	return true
}
