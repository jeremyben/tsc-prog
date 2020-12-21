export type StatusCode =
	| StatusCode.Information
	| StatusCode.Success
	| StatusCode.Redirection
	| StatusCode.ClientError
	| StatusCode.ServerError

// Both need to be exported to avoid false positive of name conflict.

export namespace StatusCode {
	export type Information = 100 | 101 | 102 | 103
	export type Success = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
	export type Redirection = 300 | 301 | 302 | 303 | 304 | 307 | 308
	// prettier-ignore
	export type ClientError = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
	export type ServerError = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511
}
