import type { Operator } from '../../domain/entities/operator.entity.js';

export interface OperatorRepository {
	insert(operator: Operator): Promise<void>;

	save(operator: Operator): Promise<void>;

	findById(restaurantId: string, operatorId: string): Promise<Operator | null>;

	findByEmail(restaurantId: string, email: string): Promise<Operator | null>;

	countByRestaurant(restaurantId: string): Promise<number>;
}
