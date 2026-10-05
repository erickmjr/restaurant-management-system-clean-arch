import type { RestaurantRepository } from '../../../application/repositories/restaurant.repository.js';
import { Restaurant, type RestaurantProps } from '../../../domain/entities/restaurant.entity.js';

export class InMemoryRestaurantRepository implements RestaurantRepository {
	private readonly rows = new Map<string, RestaurantProps>();

	async insert(restaurant: Restaurant): Promise<void> {
		this.rows.set(restaurant.id, restaurant.snapshot());
	}

	async save(restaurant: Restaurant): Promise<void> {
		this.rows.set(restaurant.id, restaurant.snapshot());
	}

	async findById(restaurantId: string): Promise<Restaurant | null> {
		const row = this.rows.get(restaurantId);

		return row === undefined ? null : Restaurant.restore({ ...row });
	}

	count(): number {
		return this.rows.size;
	}
}
