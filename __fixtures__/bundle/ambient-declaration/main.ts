import { ExternalInterface, ExternalNamespace } from 'http'
import { InternalInterface } from './internal'
import { Augmentation } from 'os'

export { CpuInfo } from 'os'

export const message: GlobalNamespace.Message = { text: 'hello', type: 'new' }

export const glob: GlobalInterface = { example: '' }

export const ext: ExternalInterface = { hello: '' }

export const ext2: ExternalNamespace.Interface = { hi: '' }

export const int: InternalInterface = { text: 'hello', number: 1 }

export const aug: Augmentation = { version: '1' }

export { ExternalNamespace, GlobalInterface }

declare global {
	/**
	 * Global namespace augmentation.
	 */
	namespace GlobalNamespace {
		interface Message {
			type: string
		}
	}

	interface GlobalInterface {
		example: string
	}
}

declare module 'http' {
	export interface ExternalInterface {
		hello: string
	}

	export namespace ExternalNamespace {
		interface Interface {
			hi: string
		}
	}
}

declare module './internal' {
	export interface InternalInterface {
		number: number
	}
}
