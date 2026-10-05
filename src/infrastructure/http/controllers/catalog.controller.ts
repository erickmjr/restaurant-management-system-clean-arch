import type { Request, Response } from 'express';
import type {
	CreateExpenseCategoryUseCase,
	ListExpenseCategoriesUseCase,
	RenameExpenseCategoryUseCase,
} from '../../../application/useCases/expenseCategory.useCases.js';
import type {
	AttachTagToPaymentMethodUseCase,
	CreatePaymentMethodUseCase,
	DetachTagFromPaymentMethodUseCase,
	ListPaymentMethodsUseCase,
	RenamePaymentMethodUseCase,
} from '../../../application/useCases/paymentMethod.useCases.js';
import type {
	CreatePaymentTagUseCase,
	ListPaymentTagsUseCase,
	RenamePaymentTagUseCase,
} from '../../../application/useCases/paymentTag.useCases.js';
import { requireAuth } from '../middlewares/authenticate.middleware.js';
import { attachTagSchema, catalogItemSchema, idParamSchema } from '../schemas/request.schemas.js';

export class PaymentMethodController {
	constructor(
		private readonly createUseCase: CreatePaymentMethodUseCase,
		private readonly renameUseCase: RenamePaymentMethodUseCase,
		private readonly listUseCase: ListPaymentMethodsUseCase,
		private readonly attachTagUseCase: AttachTagToPaymentMethodUseCase,
		private readonly detachTagUseCase: DetachTagFromPaymentMethodUseCase,
	) {}

	create = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.createUseCase.execute({
			restaurantId: auth.restaurantId,
			name: body.name,
		});

		response.status(201).json(result);
	};

	rename = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.renameUseCase.execute({
			restaurantId: auth.restaurantId,
			itemId: params.id,
			name: body.name,
		});

		response.status(200).json(result);
	};

	list = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);

		const result = await this.listUseCase.execute({ restaurantId: auth.restaurantId });

		response.status(200).json(result);
	};

	attachTag = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = attachTagSchema.parse(request.body);

		const result = await this.attachTagUseCase.execute({
			restaurantId: auth.restaurantId,
			paymentMethodId: params.id,
			paymentTagId: body.paymentTagId,
		});

		response.status(200).json(result);
	};

	detachTag = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const tagId = request.params.tagId as string;

		const result = await this.detachTagUseCase.execute({
			restaurantId: auth.restaurantId,
			paymentMethodId: params.id,
			paymentTagId: tagId,
		});

		response.status(200).json(result);
	};
}

export class ExpenseCategoryController {
	constructor(
		private readonly createUseCase: CreateExpenseCategoryUseCase,
		private readonly renameUseCase: RenameExpenseCategoryUseCase,
		private readonly listUseCase: ListExpenseCategoriesUseCase,
	) {}

	create = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.createUseCase.execute({
			restaurantId: auth.restaurantId,
			name: body.name,
		});

		response.status(201).json(result);
	};

	rename = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.renameUseCase.execute({
			restaurantId: auth.restaurantId,
			itemId: params.id,
			name: body.name,
		});

		response.status(200).json(result);
	};

	list = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);

		const result = await this.listUseCase.execute({ restaurantId: auth.restaurantId });

		response.status(200).json(result);
	};
}

export class PaymentTagController {
	constructor(
		private readonly createUseCase: CreatePaymentTagUseCase,
		private readonly renameUseCase: RenamePaymentTagUseCase,
		private readonly listUseCase: ListPaymentTagsUseCase,
	) {}

	create = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.createUseCase.execute({
			restaurantId: auth.restaurantId,
			name: body.name,
		});

		response.status(201).json(result);
	};

	rename = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const params = idParamSchema.parse(request.params);
		const body = catalogItemSchema.parse(request.body);

		const result = await this.renameUseCase.execute({
			restaurantId: auth.restaurantId,
			itemId: params.id,
			name: body.name,
		});

		response.status(200).json(result);
	};

	list = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);

		const result = await this.listUseCase.execute({ restaurantId: auth.restaurantId });

		response.status(200).json(result);
	};
}
