import type {
	BalanceQueryRepository,
	BalanceSummaryView,
	BalanceView,
	CashFlowReportView,
	GroupTotalView,
	ReportQueryRepository,
} from '../../../application/repositories/query.repositories.js';
import type { Balance } from '../../../domain/entities/balance.entity.js';
import type { InMemoryBalanceRepository } from './inMemoryBalance.repository.js';
import type {
	InMemoryExpenseCategoryRepository,
	InMemoryPaymentMethodRepository,
} from './inMemoryCatalog.repositories.js';

function toSummary(balance: Balance): BalanceSummaryView {
	return {
		id: balance.id,
		competence: balance.competence.toISODate(),
		totalEntriesInCents: balance.totalEntries().cents,
		totalExpensesInCents: balance.totalExpenses().cents,
		netInCents: balance.netInCents(),
	};
}

export class InMemoryQueryRepository implements BalanceQueryRepository, ReportQueryRepository {
	constructor(
		private readonly balances: InMemoryBalanceRepository,
		private readonly paymentMethods: InMemoryPaymentMethodRepository,
		private readonly expenseCategories: InMemoryExpenseCategoryRepository,
	) {}

	private async nameMaps(
		restaurantId: string,
	): Promise<{ methods: Map<string, string>; categories: Map<string, string> }> {
		const methods = await this.paymentMethods.listByRestaurant(restaurantId);
		const categories = await this.expenseCategories.listByRestaurant(restaurantId);

		return {
			methods: new Map(methods.map((method) => [method.id, method.name])),
			categories: new Map(categories.map((category) => [category.id, category.name])),
		};
	}

	async findByCompetence(
		restaurantId: string,
		competence: string,
		now: Date,
	): Promise<BalanceView | null> {
		const balance = this.balances
			.listByRestaurant(restaurantId)
			.find((candidate) => candidate.competence.toISODate() === competence);

		if (balance === undefined) {
			return null;
		}

		const names = await this.nameMaps(restaurantId);

		return {
			id: balance.id,
			restaurantId: balance.restaurantId,
			competence: balance.competence.toISODate(),
			createdAt: balance.createdAt,
			updatedAt: balance.updatedAt,
			updatedBy: balance.updatedBy,
			lockedAt: balance.lockedAt,
			isLocked: balance.isLocked(now),
			totalEntriesInCents: balance.totalEntries().cents,
			totalExpensesInCents: balance.totalExpenses().cents,
			netInCents: balance.netInCents(),
			entries: balance.entries.map((entry) => ({
				id: entry.id,
				operatorId: entry.operatorId,
				paymentMethodId: entry.paymentMethodId,
				paymentMethodName: names.methods.get(entry.paymentMethodId) ?? '',
				amountInCents: entry.amount.cents,
				observation: entry.observation,
				createdAt: entry.createdAt,
				updatedAt: entry.updatedAt,
				updatedBy: entry.updatedBy,
			})),
			expenses: balance.expenses.map((expense) => ({
				id: expense.id,
				operatorId: expense.operatorId,
				expenseCategoryId: expense.expenseCategoryId,
				expenseCategoryName: names.categories.get(expense.expenseCategoryId) ?? '',
				amountInCents: expense.amount.cents,
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
		return this.balances
			.listByRestaurant(restaurantId)
			.filter((balance) => {
				const competence = balance.competence.toISODate();

				return competence >= from && competence <= to;
			})
			.map(toSummary);
	}

	async cashFlow(restaurantId: string, from: string, to: string): Promise<CashFlowReportView> {
		const names = await this.nameMaps(restaurantId);

		const balances = this.balances.listByRestaurant(restaurantId).filter((balance) => {
			const competence = balance.competence.toISODate();

			return competence >= from && competence <= to;
		});

		const byPaymentMethod = new Map<string, GroupTotalView>();
		const byExpenseCategory = new Map<string, GroupTotalView>();

		let totalEntriesInCents = 0;
		let totalExpensesInCents = 0;

		for (const balance of balances) {
			totalEntriesInCents += balance.totalEntries().cents;
			totalExpensesInCents += balance.totalExpenses().cents;

			for (const entry of balance.entries) {
				const current = byPaymentMethod.get(entry.paymentMethodId);

				byPaymentMethod.set(entry.paymentMethodId, {
					id: entry.paymentMethodId,
					name: names.methods.get(entry.paymentMethodId) ?? '',
					totalInCents: (current?.totalInCents ?? 0) + entry.amount.cents,
				});
			}

			for (const expense of balance.expenses) {
				const current = byExpenseCategory.get(expense.expenseCategoryId);

				byExpenseCategory.set(expense.expenseCategoryId, {
					id: expense.expenseCategoryId,
					name: names.categories.get(expense.expenseCategoryId) ?? '',
					totalInCents: (current?.totalInCents ?? 0) + expense.amount.cents,
				});
			}
		}

		const byTotalDesc = (left: GroupTotalView, right: GroupTotalView): number =>
			right.totalInCents - left.totalInCents;

		return {
			from,
			to,
			totalEntriesInCents,
			totalExpensesInCents,
			netInCents: totalEntriesInCents - totalExpensesInCents,
			days: balances.map(toSummary),
			byPaymentMethod: [...byPaymentMethod.values()].sort(byTotalDesc),
			byExpenseCategory: [...byExpenseCategory.values()].sort(byTotalDesc),
		};
	}
}
