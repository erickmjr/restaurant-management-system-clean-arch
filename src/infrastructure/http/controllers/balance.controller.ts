import type { Request, Response } from 'express';
import type { GetBalanceByCompetenceUseCase } from '../../../application/useCases/GetBalanceByCompetence.useCase.js';
import type { RegisterEntryUseCase } from '../../../application/useCases/RegisterEntry.useCase.js';
import type { RegisterExpenseUseCase } from '../../../application/useCases/RegisterExpense.useCase.js';
import type { RemoveEntryUseCase } from '../../../application/useCases/RemoveEntry.useCase.js';
import type { RemoveExpenseUseCase } from '../../../application/useCases/RemoveExpense.useCase.js';
import type { UpdateEntryUseCase } from '../../../application/useCases/UpdateEntry.useCase.js';
import type { UpdateExpenseUseCase } from '../../../application/useCases/UpdateExpense.useCase.js';
import { requireAuth } from '../middlewares/authenticate.middleware.js';
import {
	competenceParamSchema,
	idParamSchema,
	registerEntrySchema,
	registerExpenseSchema,
	updateEntrySchema,
	updateExpenseSchema,
} from '../schemas/request.schemas.js';

export class BalanceController {
	constructor(
		private readonly registerEntry: RegisterEntryUseCase,
		private readonly registerExpense: RegisterExpenseUseCase,
		private readonly updateEntry: UpdateEntryUseCase,
		private readonly removeEntry: RemoveEntryUseCase,
		private readonly updateExpense: UpdateExpenseUseCase,
		private readonly removeExpense: RemoveExpenseUseCase,
		private readonly getBalanceByCompetence: GetBalanceByCompetenceUseCase,
	) {}

	createEntry = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = registerEntrySchema.parse(request.body);

		const result = await this.registerEntry.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			competence: body.competence,
			paymentMethodId: body.paymentMethodId,
			amountInCents: body.amountInCents,
			observation: body.observation ?? null,
		});

		response.status(201).json(result);
	};

	patchEntry = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = updateEntrySchema.parse(request.body);

		const result = await this.updateEntry.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			entryId: params.id,
			...body,
		});

		response.status(200).json(result);
	};

	deleteEntry = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);

		await this.removeEntry.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			entryId: params.id,
		});

		response.status(204).send();
	};

	createExpense = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = registerExpenseSchema.parse(request.body);

		const result = await this.registerExpense.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			competence: body.competence,
			expenseCategoryId: body.expenseCategoryId,
			amountInCents: body.amountInCents,
			observation: body.observation ?? null,
		});

		response.status(201).json(result);
	};

	patchExpense = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = updateExpenseSchema.parse(request.body);

		const result = await this.updateExpense.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			expenseId: params.id,
			...body,
		});

		response.status(200).json(result);
	};

	deleteExpense = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);

		await this.removeExpense.execute({
			restaurantId: auth.restaurantId,
			operatorId: auth.operatorId,
			expenseId: params.id,
		});

		response.status(204).send();
	};

	getByCompetence = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = competenceParamSchema.parse(request.params);

		const result = await this.getBalanceByCompetence.execute({
			restaurantId: auth.restaurantId,
			competence: params.competence,
		});

		response.status(200).json(result);
	};
}
