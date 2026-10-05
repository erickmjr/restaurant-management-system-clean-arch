import { ExpenseCategoryNotFoundError } from '../../domain/errors/catalog.errors.js';
import { Competence } from '../../domain/valueObjects/competence.vo.js';
import { Money } from '../../domain/valueObjects/money.vo.js';
import type { RegisterExpenseInput, RegisterExpenseOutput } from '../dtos/registerExpense.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { ExpenseCategoryRepository } from '../repositories/catalog.repositories.js';
import { findOrCreateBalance } from './shared/findOrCreateBalance.js';

export class RegisterExpenseUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly expenseCategoryRepository: ExpenseCategoryRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: RegisterExpenseInput): Promise<RegisterExpenseOutput> {
		const now = this.clock.now();

		const competence = Competence.create(input.competence, now);
		const amount = Money.fromCents(input.amountInCents);

		const category = await this.expenseCategoryRepository.findById(
			input.restaurantId,
			input.expenseCategoryId,
		);

		if (category === null) {
			throw new ExpenseCategoryNotFoundError(input.expenseCategoryId);
		}

		const balance = await findOrCreateBalance(
			{ balanceRepository: this.balanceRepository, idGenerator: this.idGenerator },
			{
				restaurantId: input.restaurantId,
				competence,
				operatorId: input.operatorId,
				now,
			},
		);

		const expense = balance.registerExpense({
			id: this.idGenerator.generate(),
			operatorId: input.operatorId,
			expenseCategoryId: category.id,
			amount,
			observation: input.observation ?? null,
			now,
		});

		await this.balanceRepository.save(balance);

		return {
			expenseId: expense.id,
			balanceId: balance.id,
			competence: balance.competence.toISODate(),
			amountInCents: expense.amount.cents,
			createdAt: expense.createdAt,
			balanceLockedAt: balance.lockedAt,
		};
	}
}
