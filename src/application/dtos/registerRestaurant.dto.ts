export interface RegisterRestaurantInput {
	name: string;
	photo?: string | null;
}

export interface RegisterRestaurantOutput {
	restaurantId: string;
	name: string;
	createdAt: Date;
}
