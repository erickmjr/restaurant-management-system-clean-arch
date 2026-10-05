import { ConflictError, NotFoundError, ValidationError } from './domain.error.js';

export class PaymentMethodNotFoundError extends NotFoundError {
	readonly code = 'PAYMENT_METHOD_NOT_FOUND';

	constructor(paymentMethodId: string) {
		super('Método de pagamento não encontrado.', { paymentMethodId });
	}
}

export class ExpenseCategoryNotFoundError extends NotFoundError {
	readonly code = 'EXPENSE_CATEGORY_NOT_FOUND';

	constructor(expenseCategoryId: string) {
		super('Categoria de saída não encontrada.', { expenseCategoryId });
	}
}

export class PaymentTagNotFoundError extends NotFoundError {
	readonly code = 'PAYMENT_TAG_NOT_FOUND';

	constructor(paymentTagId: string) {
		super('Tag de pagamento não encontrada.', { paymentTagId });
	}
}

export class EmptyCatalogNameError extends ValidationError {
	readonly code = 'CATALOG_NAME_EMPTY';

	constructor() {
		super('Nome é obrigatório.');
	}
}

export class CatalogNameAlreadyInUseError extends ConflictError {
	readonly code = 'CATALOG_NAME_IN_USE';

	constructor(name: string) {
		super('Já existe um registro com este nome neste restaurante.', { name });
	}
}
