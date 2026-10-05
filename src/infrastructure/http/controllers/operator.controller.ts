import type { Request, Response } from 'express';
import type { AuthenticateOperatorUseCase } from '../../../application/useCases/AuthenticateOperator.useCase.js';
import type { RegisterOperatorUseCase } from '../../../application/useCases/RegisterOperator.useCase.js';
import { requireAuth } from '../middlewares/authenticate.middleware.js';
import { authenticateSchema, registerOperatorSchema } from '../schemas/request.schemas.js';

export class OperatorController {
	constructor(
		private readonly registerOperator: RegisterOperatorUseCase,
		private readonly authenticateOperator: AuthenticateOperatorUseCase,
	) {}

	bootstrap = async (request: Request, response: Response): Promise<void> => {
		const body = registerOperatorSchema.parse(request.body);
		const restaurantId = request.params.restaurantId as string;

		const result = await this.registerOperator.execute({
			restaurantId,
			name: body.name,
			email: body.email,
			plainPassword: body.password,
			role: body.role,
		});

		response.status(201).json(result);
	};

	create = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = registerOperatorSchema.parse(request.body);

		const result = await this.registerOperator.execute({
			restaurantId: auth.restaurantId,
			name: body.name,
			email: body.email,
			plainPassword: body.password,
			role: body.role,
		});

		response.status(201).json(result);
	};

	login = async (request: Request, response: Response): Promise<void> => {
		const body = authenticateSchema.parse(request.body);

		const result = await this.authenticateOperator.execute({
			restaurantId: body.restaurantId,
			email: body.email,
			plainPassword: body.password,
		});

		response.status(200).json(result);
	};

	me = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);

		response.status(200).json(auth);
	};
}
