export interface UpdateExpenseInput {
	restaurantId: string;
	operatorId: string;
	expenseId: string;
	expenseCategoryId?: string;
	amountInCents?: number;
	observation?: string | null;
}

export interface UpdateExpenseOutput {
	expenseId: string;
	balanceId: string;
	amountInCents: number;
	expenseCategoryId: string;
	observation: string | null;
	updatedAt: Date;
	updatedBy: string;
}

export interface RemoveExpenseInput {
	restaurantId: string;
	operatorId: string;
	expenseId: string;
}
