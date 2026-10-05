export interface CreateCatalogItemInput {
	restaurantId: string;
	name: string;
}

export interface RenameCatalogItemInput {
	restaurantId: string;
	itemId: string;
	name: string;
}

export interface CatalogItemOutput {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaymentMethodOutput extends CatalogItemOutput {
	tagIds: readonly string[];
}

export interface ChangePaymentMethodTagInput {
	restaurantId: string;
	paymentMethodId: string;
	paymentTagId: string;
}

export interface ListCatalogInput {
	restaurantId: string;
}
