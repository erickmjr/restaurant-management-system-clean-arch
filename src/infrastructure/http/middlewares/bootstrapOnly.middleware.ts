import type { RequestHandler } from 'express';
import type { OperatorRepository } from '../../../application/repositories/operator.repository.js';
import { ForbiddenError } from '../../../domain/errors/domain.error.js';
import { RestaurantNotFoundError } from '../../../domain/errors/restaurant.errors.js';

class RestaurantAlreadyHasOperatorsError extends ForbiddenError {
	readonly code = 'RESTAURANT_ALREADY_BOOTSTRAPPED';

	constructor(restaurantId: string) {
		super('Este restaurante já tem operador. Crie novos operadores autenticado como dono.', {
			restaurantId,
		});
	}
}

export function bootstrapOnly(operatorRepository: OperatorRepository): RequestHandler {
	return async (request, _response, next) => {
		try {
			const restaurantId = request.params.restaurantId;

			if (typeof restaurantId !== 'string' || restaurantId.length === 0) {
				throw new RestaurantNotFoundError(String(restaurantId));
			}

			const existing = await operatorRepository.countByRestaurant(restaurantId);

			if (existing > 0) {
				throw new RestaurantAlreadyHasOperatorsError(restaurantId);
			}

			next();
		} catch (error) {
			next(error);
		}
	};
}
