/**
 * Status codes
 */
export enum Status {
	OK = 200,
	Error = 400,
}

export namespace Status {
	export function getError() {
		return Status.Error
	}
}

/**
 * content-type
 */
export enum ContentType {
	Json = 'application/json',
	Html = 'text/html',
}

/**
 * HTTP verbs
 */
export const enum Verb {
	Get = 'GET',
	Post = 'POST',
}
