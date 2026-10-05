import type { Request, Response } from 'express';
import type { RegisterRestaurantUseCase } from '../../../application/useCases/RegisterRestaurant.useCase.js';
import { registerRestaurantSchema } from '../schemas/request.schemas.js';

export class RestaurantController {
	constructor(private readonly registerRestaurant: RegisterRestaurantUseCase) {}

	create = async (request: Request, response: Response): Promise<void> => {
		const body = registerRestaurantSchema.parse(request.body);

		const result = await this.registerRestaurant.execute({
			name: body.name,
			photo: body.photo ?? null,
		});

		response.status(201).json(result);
	};
}
