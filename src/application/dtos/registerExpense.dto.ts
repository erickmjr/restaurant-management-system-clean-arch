export interface RegisterExpenseInput {
	restaurantId: string;
	operatorId: string;
	competence: string;
	expenseCategoryId: string;
	amountInCents: number;
	observation?: string | null;
}

export interface RegisterExpenseOutput {
	expenseId: string;
	balanceId: string;
	competence: string;
	amountInCents: number;
	createdAt: Date;
	balanceLockedAt: Date;
}
