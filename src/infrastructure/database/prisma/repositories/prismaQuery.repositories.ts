import type { PrismaClient } from '@prisma/client';
import type {
	BalanceQueryRepository,
	BalanceSummaryView,
	BalanceView,
	CashFlowReportView,
	GroupTotalView,
	ReportQueryRepository,
} from '../../../../application/repositories/query.repositories.js';
import { EDIT_WINDOW_IN_DAYS } from '../../../../domain/entities/balance.entity.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toISODate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function parseISODate(value: string): Date {
	return new Date(`${value}T00:00:00.000Z`);
}

function lockedAtOf(createdAt: Date): Date {
	return new Date(createdAt.getTime() + EDIT_WINDOW_IN_DAYS * DAY_IN_MS);
}

const WITH_CHILDREN = {
	entries: { include: { paymentMethod: true } },
	expenses: { include: { expenseCategory: true } },
} as const;

export class PrismaBalanceQueryRepository implements BalanceQueryRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByCompetence(
		restaurantId: string,
		competence: string,
		now: Date,
	): Promise<BalanceView | null> {
		const row = await this.prisma.balance.findUnique({
			where: { restaurantId_competence: { restaurantId, competence: parseISODate(competence) } },
			include: WITH_CHILDREN,
		});

		if (row === null) {
			return null;
		}

		const totalEntriesInCents = row.entries.reduce(
			(total, entry) => total + entry.amountInCents,
			0,
		);
		const totalExpensesInCents = row.expenses.reduce(
			(total, expense) => total + expense.amountInCents,
			0,
		);
		const lockedAt = lockedAtOf(row.createdAt);

		return {
			id: row.id,
			restaurantId: row.restaurantId,
			competence: toISODate(row.competence),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			updatedBy: row.updatedBy,
			lockedAt,
			isLocked: now.getTime() >= lockedAt.getTime(),
			totalEntriesInCents,
			totalExpensesInCents,
			netInCents: totalEntriesInCents - totalExpensesInCents,
			entries: row.entries.map((entry) => ({
				id: entry.id,
				operatorId: entry.operatorId,
				paymentMethodId: entry.paymentMethodId,
				paymentMethodName: entry.paymentMethod.name,
				amountInCents: entry.amountInCents,
				observation: entry.observation,
				createdAt: entry.createdAt,
				updatedAt: entry.updatedAt,
				updatedBy: entry.updatedBy,
			})),
			expenses: row.expenses.map((expense) => ({
				id: expense.id,
				operatorId: expense.operatorId,
				expenseCategoryId: expense.expenseCategoryId,
				expenseCategoryName: expense.expenseCategory.name,
				amountInCents: expense.amountInCents,
				observation: expense.observation,
				createdAt: expense.createdAt,
				updatedAt: expense.updatedAt,
				updatedBy: expense.updatedBy,
			})),
		};
	}

	async listByPeriod(
		restaurantId: string,
		from: string,
		to: string,
	): Promise<BalanceSummaryView[]> {
		const rows = await this.prisma.balance.findMany({
			where: {
				restaurantId,
				competence: { gte: parseISODate(from), lte: parseISODate(to) },
			},
			include: { entries: true, expenses: true },
			orderBy: { competence: 'asc' },
		});

		return rows.map((row) => {
			const totalEntriesInCents = row.entries.reduce(
				(total, entry) => total + entry.amountInCents,
				0,
			);
			const totalExpensesInCents = row.expenses.reduce(
				(total, expense) => total + expense.amountInCents,
				0,
			);

			return {
				id: row.id,
				competence: toISODate(row.competence),
				totalEntriesInCents,
				totalExpensesInCents,
				netInCents: totalEntriesInCents - totalExpensesInCents,
			};
		});
	}
}

export class PrismaReportQueryRepository implements ReportQueryRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async cashFlow(restaurantId: string, from: string, to: string): Promise<CashFlowReportView> {
		const rows = await this.prisma.balance.findMany({
			where: {
				restaurantId,
				competence: { gte: parseISODate(from), lte: parseISODate(to) },
			},
			include: WITH_CHILDREN,
			orderBy: { competence: 'asc' },
		});

		const byPaymentMethod = new Map<string, GroupTotalView>();
		const byExpenseCategory = new Map<string, GroupTotalView>();

		let totalEntriesInCents = 0;
		let totalExpensesInCents = 0;

		const days: BalanceSummaryView[] = rows.map((row) => {
			let dayEntries = 0;
			let dayExpenses = 0;

			for (const entry of row.entries) {
				dayEntries += entry.amountInCents;

				const current = byPaymentMethod.get(entry.paymentMethodId);

				byPaymentMethod.set(entry.paymentMethodId, {
					id: entry.paymentMethodId,
					name: entry.paymentMethod.name,
					totalInCents: (current?.totalInCents ?? 0) + entry.amountInCents,
				});
			}

			for (const expense of row.expenses) {
				dayExpenses += expense.amountInCents;

				const current = byExpenseCategory.get(expense.expenseCategoryId);

				byExpenseCategory.set(expense.expenseCategoryId, {
					id: expense.expenseCategoryId,
					name: expense.expenseCategory.name,
					totalInCents: (current?.totalInCents ?? 0) + expense.amountInCents,
				});
			}

			totalEntriesInCents += dayEntries;
			totalExpensesInCents += dayExpenses;

			return {
				id: row.id,
				competence: toISODate(row.competence),
				totalEntriesInCents: dayEntries,
				totalExpensesInCents: dayExpenses,
				netInCents: dayEntries - dayExpenses,
			};
		});

		const byTotalDesc = (left: GroupTotalView, right: GroupTotalView): number =>
			right.totalInCents - left.totalInCents;

		return {
			from,
			to,
			totalEntriesInCents,
			totalExpensesInCents,
			netInCents: totalEntriesInCents - totalExpensesInCents,
			days,
			byPaymentMethod: [...byPaymentMethod.values()].sort(byTotalDesc),
			byExpenseCategory: [...byExpenseCategory.values()].sort(byTotalDesc),
		};
	}
}
