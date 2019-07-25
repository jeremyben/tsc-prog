import { randomBytes } from 'crypto'
import * as data from './other/data.json'

const random = randomBytes(32).toString('utf8')
const isFixture = data.jsonFixture
