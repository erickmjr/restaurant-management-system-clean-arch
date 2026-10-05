import { ConflictError, NotFoundError, RefusalError, ValidationError } from './domain.error.js';

export class BalanceLockedError extends RefusalError {
	readonly code = 'BALANCE_LOCKED';

	constructor(balanceId: string, createdAt: Date, now: Date) {
		super('A janela de três dias deste balanço já fechou.', {
			balanceId,
			createdAt: createdAt.toISOString(),
			now: now.toISOString(),
		});
	}
}

export class ZeroAmountEntryError extends RefusalError {
	readonly code = 'ENTRY_AMOUNT_ZERO';

	constructor() {
		super('Uma entrada de venda não pode ter valor zero.');
	}
}

export class ZeroAmountExpenseError extends RefusalError {
	readonly code = 'EXPENSE_AMOUNT_ZERO';

	constructor() {
		super('Uma saída não pode ter valor zero.');
	}
}

export class BalanceNotFoundError extends NotFoundError {
	readonly code = 'BALANCE_NOT_FOUND';

	constructor(details: Record<string, unknown> = {}) {
		super('Balanço não encontrado.', details);
	}
}

export class EntryNotFoundError extends NotFoundError {
	readonly code = 'ENTRY_NOT_FOUND';

	constructor(entryId: string) {
		super('Lançamento de entrada não encontrado.', { entryId });
	}
}

export class ExpenseNotFoundError extends NotFoundError {
	readonly code = 'EXPENSE_NOT_FOUND';

	constructor(expenseId: string) {
		super('Lançamento de saída não encontrado.', { expenseId });
	}
}

export class BalanceAlreadyExistsError extends ConflictError {
	readonly code = 'BALANCE_ALREADY_EXISTS';

	constructor(restaurantId: string, competence: string) {
		super('Já existe balanço para esta competência.', { restaurantId, competence });
	}
}

export class EmptyObservationError extends ValidationError {
	readonly code = 'OBSERVATION_EMPTY';

	constructor() {
		super('Observação, quando informada, não pode ser só espaço.');
	}
}
