import ts from 'typescript'
const emitFlags = ts.EmitFlags
export { emitFlags }

import typescript = require('typescript')
export const options: typescript.TokenFlags = 1

export { run } from 'jest'
export { IncomingHttpHeaders } from 'http'

export * from 'tslint'
export * from 'dns'

import * as utils from 'util'
export { utils }

import { StringDecoder } from 'string_decoder'
export { StringDecoder }

import { OutgoingHttpHeaders } from 'http'
export type OutgoingHeaders = OutgoingHttpHeaders

export type Digest = typeof import('ts-jest').digest

export { randomBytesB } from './namespaces'
