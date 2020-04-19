export class User<T extends User = any> {
	name: string

	constructor(data: T) {
		this.name = data.name
	}
}
