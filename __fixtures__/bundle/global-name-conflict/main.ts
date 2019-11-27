export { isMyPromise } from './my-promise'

export { getRealDate } from './get-real-date'

export { Date } from './my-date'

import { Date as MyDate } from './my-date'

export const myDate = new MyDate()

export const Date_1 = new Date().getTime() // tslint:disable-line: variable-name
