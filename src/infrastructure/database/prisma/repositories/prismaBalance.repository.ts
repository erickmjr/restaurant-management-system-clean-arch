import type { PrismaClient } from '@prisma/client';
import type { BalanceRepository } from '../../../../application/repositories/balance.repository.js';
import type { Balance } from '../../../../domain/entities/balance.entity.js';
import { BalanceAlreadyExistsError } from '../../../../domain/errors/balance.errors.js';
import type { Competence } from '../../../../domain/valueObjects/competence.vo.js';
import { isUniqueViolation } from '../client.js';
import {
	toBalanceDomain,
	toBalanceRow,
	toEntryRow,
	toExpenseRow,
} from '../mappers/domain.mappers.js';

const WITH_CHILDREN = { entries: true, expenses: true } as const;

export class PrismaBalanceRepository implements BalanceRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(balance: Balance): Promise<void> {
		const row = toBalanceRow(balance);

		try {
			await this.prisma.balance.create({ data: row });
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new BalanceAlreadyExistsError(row.restaurantId, row.competence.toISOString());
			}

			throw error;
		}
	}

	async save(balance: Balance): Promise<void> {
		const row = toBalanceRow(balance);
		const entries = balance.entries.map(toEntryRow);
		const expenses = balance.expenses.map(toExpenseRow);

		await this.prisma.$transaction(async (tx) => {
			await tx.balance.update({
				where: { id: row.id },
				data: { updatedAt: row.updatedAt, updatedBy: row.updatedBy },
			});

			await tx.entry.deleteMany({
				where: { balanceId: row.id, id: { notIn: entries.map((entry) => entry.id) } },
			});

			await tx.expense.deleteMany({
				where: { balanceId: row.id, id: { notIn: expenses.map((expense) => expense.id) } },
			});

			for (const entry of entries) {
				await tx.entry.upsert({
					where: { id: entry.id },
					create: entry,
					update: {
						paymentMethodId: entry.paymentMethodId,
						amountInCents: entry.amountInCents,
						observation: entry.observation,
						updatedAt: entry.updatedAt,
						updatedBy: entry.updatedBy,
					},
				});
			}

			for (const expense of expenses) {
				await tx.expense.upsert({
					where: { id: expense.id },
					create: expense,
					update: {
						expenseCategoryId: expense.expenseCategoryId,
						amountInCents: expense.amountInCents,
						observation: expense.observation,
						updatedAt: expense.updatedAt,
						updatedBy: expense.updatedBy,
					},
				});
			}
		});
	}

	async findByCompetence(restaurantId: string, competence: Competence): Promise<Balance | null> {
		const row = await this.prisma.balance.findUnique({
			where: { restaurantId_competence: { restaurantId, competence: competence.date } },
			include: WITH_CHILDREN,
		});

		return row === null ? null : toBalanceDomain(row, row.entries, row.expenses);
	}

	async findById(restaurantId: string, balanceId: string): Promise<Balance | null> {
		const row = await this.prisma.balance.findFirst({
			where: { id: balanceId, restaurantId },
			include: WITH_CHILDREN,
		});

		return row === null ? null : toBalanceDomain(row, row.entries, row.expenses);
	}

	async findByEntryId(restaurantId: string, entryId: string): Promise<Balance | null> {
		const row = await this.prisma.balance.findFirst({
			where: { restaurantId, entries: { some: { id: entryId } } },
			include: WITH_CHILDREN,
		});

		return row === null ? null : toBalanceDomain(row, row.entries, row.expenses);
	}

	async findByExpenseId(restaurantId: string, expenseId: string): Promise<Balance | null> {
		const row = await this.prisma.balance.findFirst({
			where: { restaurantId, expenses: { some: { id: expenseId } } },
			include: WITH_CHILDREN,
		});

		return row === null ? null : toBalanceDomain(row, row.entries, row.expenses);
	}
}
