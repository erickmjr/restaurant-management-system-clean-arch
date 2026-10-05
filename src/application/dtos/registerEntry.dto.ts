export interface RegisterEntryInput {
	restaurantId: string;
	operatorId: string;
	competence: string;
	paymentMethodId: string;
	amountInCents: number;
	observation?: string | null;
}

export interface RegisterEntryOutput {
	entryId: string;
	balanceId: string;
	competence: string;
	amountInCents: number;
	createdAt: Date;
	balanceLockedAt: Date;
}
