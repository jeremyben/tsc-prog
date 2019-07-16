import { pseudoRandomBytes } from 'crypto'

const pseudoRandom = pseudoRandomBytes(32).toString('utf8')
