import { User, OtherInterface } from './interfaces'

/**
 * @public
 */
export default class UserController {
	/**
	 * User repository.
	 */
	repository: UserRepository

	/**
	 * Creates an instance of UserController
	 */
	constructor(repository: UserRepository) {
		this.repository = repository
	}

	/**
	 * @returns a user
	 */
	getOne(): User {
		return {
			name: this.repository.names[random(0, 3)],
			age: random(20, 50),
			gender: 'M',
		}
	}
}

const globalThis = 'user'

/**
 * @public
 */
export class UserRepository {
	/**
	 * Model name
	 */
	static model = globalThis

	names = ['Jeremy', 'Sophie', 'Damien', 'Laetitia']
}

// tslint:disable-next-line: no-empty-interface
export interface UserRepository extends OtherInterface {}

export namespace UserRepository {
	export function getModel() {
		return UserRepository.model
	}
}

function random(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}
