import type { PrismaClient } from '@prisma/client';
import type { RestaurantRepository } from '../../../../application/repositories/restaurant.repository.js';
import type { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { toRestaurantDomain, toRestaurantRow } from '../mappers/domain.mappers.js';

export class PrismaRestaurantRepository implements RestaurantRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(restaurant: Restaurant): Promise<void> {
		await this.prisma.restaurant.create({ data: toRestaurantRow(restaurant) });
	}

	async save(restaurant: Restaurant): Promise<void> {
		const row = toRestaurantRow(restaurant);

		await this.prisma.restaurant.update({
			where: { id: row.id },
			data: {
				name: row.name,
				photo: row.photo,
				updatedAt: row.updatedAt,
				deletedAt: row.deletedAt,
			},
		});
	}

	async findById(restaurantId: string): Promise<Restaurant | null> {
		const row = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });

		return row === null ? null : toRestaurantDomain(row);
	}
}
