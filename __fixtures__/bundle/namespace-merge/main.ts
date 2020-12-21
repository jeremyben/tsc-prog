import { StatusCode } from './interfaces'

type Request = {
	status: StatusCode
}

export const request: Request = { status: 100 }
