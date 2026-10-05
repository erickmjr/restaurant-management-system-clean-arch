import { ExpenseNotFoundError } from '../../domain/errors/balance.errors.js';
import { OperatorNotFoundError } from '../../domain/errors/operator.errors.js';
import type { RemoveExpenseInput } from '../dtos/updateExpense.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';
import { assertCanMutateLedgerItem } from './shared/assertCanMutateLedgerItem.js';

export class RemoveExpenseUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly operatorRepository: OperatorRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: RemoveExpenseInput): Promise<void> {
		const now = this.clock.now();

		const operator = await this.operatorRepository.findById(input.restaurantId, input.operatorId);

		if (operator === null) {
			throw new OperatorNotFoundError({ operatorId: input.operatorId });
		}

		const balance = await this.balanceRepository.findByExpenseId(
			input.restaurantId,
			input.expenseId,
		);

		if (balance === null) {
			throw new ExpenseNotFoundError(input.expenseId);
		}

		const current = balance.expenseById(input.expenseId);

		if (current === null) {
			throw new ExpenseNotFoundError(input.expenseId);
		}

		assertCanMutateLedgerItem(operator, current.operatorId);

		balance.removeExpense(input.expenseId, { operatorId: input.operatorId, now });

		await this.balanceRepository.save(balance);
	}
}
