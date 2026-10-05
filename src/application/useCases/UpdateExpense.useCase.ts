import { ExpenseNotFoundError } from '../../domain/errors/balance.errors.js';
import { ExpenseCategoryNotFoundError } from '../../domain/errors/catalog.errors.js';
import { OperatorNotFoundError } from '../../domain/errors/operator.errors.js';
import { Money } from '../../domain/valueObjects/money.vo.js';
import type { UpdateExpenseInput, UpdateExpenseOutput } from '../dtos/updateExpense.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { ExpenseCategoryRepository } from '../repositories/catalog.repositories.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';
import { assertCanMutateLedgerItem } from './shared/assertCanMutateLedgerItem.js';

export class UpdateExpenseUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly operatorRepository: OperatorRepository,
		private readonly expenseCategoryRepository: ExpenseCategoryRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: UpdateExpenseInput): Promise<UpdateExpenseOutput> {
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

		if (input.expenseCategoryId !== undefined) {
			const category = await this.expenseCategoryRepository.findById(
				input.restaurantId,
				input.expenseCategoryId,
			);

			if (category === null) {
				throw new ExpenseCategoryNotFoundError(input.expenseCategoryId);
			}
		}

		const expense = balance.changeExpense(
			input.expenseId,
			{
				amount:
					input.amountInCents === undefined ? undefined : Money.fromCents(input.amountInCents),
				expenseCategoryId: input.expenseCategoryId,
				observation: input.observation,
			},
			{ operatorId: input.operatorId, now },
		);

		await this.balanceRepository.save(balance);

		return {
			expenseId: expense.id,
			balanceId: balance.id,
			amountInCents: expense.amount.cents,
			expenseCategoryId: expense.expenseCategoryId,
			observation: expense.observation,
			updatedAt: expense.updatedAt,
			updatedBy: expense.updatedBy,
		};
	}
}
