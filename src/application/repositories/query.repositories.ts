export interface EntryView {
	id: string;
	operatorId: string;
	paymentMethodId: string;
	paymentMethodName: string;
	amountInCents: number;
	observation: string | null;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export interface ExpenseView {
	id: string;
	operatorId: string;
	expenseCategoryId: string;
	expenseCategoryName: string;
	amountInCents: number;
	observation: string | null;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export interface BalanceView {
	id: string;
	restaurantId: string;
	competence: string;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
	lockedAt: Date;
	isLocked: boolean;
	totalEntriesInCents: number;
	totalExpensesInCents: number;
	netInCents: number;
	entries: EntryView[];
	expenses: ExpenseView[];
}

export interface BalanceQueryRepository {
	findByCompetence(
		restaurantId: string,
		competence: string,
		now: Date,
	): Promise<BalanceView | null>;

	listByPeriod(
		restaurantId: string,
		from: string,
		to: string,
		now: Date,
	): Promise<BalanceSummaryView[]>;
}

export interface BalanceSummaryView {
	id: string;
	competence: string;
	totalEntriesInCents: number;
	totalExpensesInCents: number;
	netInCents: number;
}

export interface GroupTotalView {
	id: string;
	name: string;
	totalInCents: number;
}

export interface CashFlowReportView {
	from: string;
	to: string;
	totalEntriesInCents: number;
	totalExpensesInCents: number;
	netInCents: number;
	days: BalanceSummaryView[];
	byPaymentMethod: GroupTotalView[];
	byExpenseCategory: GroupTotalView[];
}

export interface ReportQueryRepository {
	cashFlow(restaurantId: string, from: string, to: string): Promise<CashFlowReportView>;
}
