import type { Restaurant } from '../../domain/entities/restaurant.entity.js';

export interface RestaurantRepository {
	insert(restaurant: Restaurant): Promise<void>;

	save(restaurant: Restaurant): Promise<void>;

	findById(restaurantId: string): Promise<Restaurant | null>;
}
