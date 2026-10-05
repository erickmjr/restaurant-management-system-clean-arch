export interface UpdateEntryInput {
	restaurantId: string;
	operatorId: string;
	entryId: string;
	paymentMethodId?: string;
	amountInCents?: number;
	observation?: string | null;
}

export interface UpdateEntryOutput {
	entryId: string;
	balanceId: string;
	amountInCents: number;
	paymentMethodId: string;
	observation: string | null;
	updatedAt: Date;
	updatedBy: string;
}

export interface RemoveEntryInput {
	restaurantId: string;
	operatorId: string;
	entryId: string;
}
