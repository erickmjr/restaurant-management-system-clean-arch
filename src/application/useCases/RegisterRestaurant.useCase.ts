import { Restaurant } from '../../domain/entities/restaurant.entity.js';
import type {
	RegisterRestaurantInput,
	RegisterRestaurantOutput,
} from '../dtos/registerRestaurant.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';

export class RegisterRestaurantUseCase {
	constructor(
		private readonly restaurantRepository: RestaurantRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: RegisterRestaurantInput): Promise<RegisterRestaurantOutput> {
		const now = this.clock.now();

		const restaurant = Restaurant.create({
			id: this.idGenerator.generate(),
			name: input.name,
			photo: input.photo ?? null,
			now,
		});

		await this.restaurantRepository.insert(restaurant);

		return {
			restaurantId: restaurant.id,
			name: restaurant.name,
			createdAt: restaurant.createdAt,
		};
	}
}
