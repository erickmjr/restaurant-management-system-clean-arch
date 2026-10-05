import { NotFoundError, RefusalError, ValidationError } from './domain.error.js';

export class RestaurantNotFoundError extends NotFoundError {
	readonly code = 'RESTAURANT_NOT_FOUND';

	constructor(restaurantId: string) {
		super('Restaurante não encontrado.', { restaurantId });
	}
}

export class EmptyRestaurantNameError extends ValidationError {
	readonly code = 'RESTAURANT_NAME_EMPTY';

	constructor() {
		super('Nome do restaurante é obrigatório.');
	}
}

export class RestaurantAlreadyDeletedError extends RefusalError {
	readonly code = 'RESTAURANT_ALREADY_DELETED';

	constructor(restaurantId: string) {
		super('Restaurante já está removido.', { restaurantId });
	}
}

export class RestaurantNotDeletedError extends RefusalError {
	readonly code = 'RESTAURANT_NOT_DELETED';

	constructor(restaurantId: string) {
		super('Restaurante não está removido.', { restaurantId });
	}
}
