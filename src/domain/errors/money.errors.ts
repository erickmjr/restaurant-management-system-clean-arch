import { RefusalError, ValidationError } from './domain.error.js';

export class NegativeMoneyError extends RefusalError {
	readonly code = 'MONEY_NEGATIVE';

	constructor(amountInCents: number) {
		super('Valor monetário não pode ser negativo.', { amountInCents });
	}
}

export class NonIntegerMoneyError extends ValidationError {
	readonly code = 'MONEY_NOT_INTEGER';

	constructor(amountInCents: number) {
		super('Valor monetário deve ser um inteiro em centavos.', { amountInCents });
	}
}
