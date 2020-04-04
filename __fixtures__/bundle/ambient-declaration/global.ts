/**
 * Global namespace.
 */
declare namespace GlobalNamespace {
	interface Message {
		text: string
	}
}

declare module 'os' {
	interface Augmentation {
		version: string
	}
}
