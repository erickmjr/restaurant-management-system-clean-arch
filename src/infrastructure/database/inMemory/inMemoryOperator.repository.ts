import type { OperatorRepository } from '../../../application/repositories/operator.repository.js';
import { Operator, type OperatorProps } from '../../../domain/entities/operator.entity.js';

export class InMemoryOperatorRepository implements OperatorRepository {
	private readonly rows = new Map<string, OperatorProps>();

	async insert(operator: Operator): Promise<void> {
		this.rows.set(operator.id, operator.snapshot());
	}

	async save(operator: Operator): Promise<void> {
		this.rows.set(operator.id, operator.snapshot());
	}

	async findById(restaurantId: string, operatorId: string): Promise<Operator | null> {
		const row = this.rows.get(operatorId);

		if (row === undefined || row.restaurantId !== restaurantId) {
			return null;
		}

		return Operator.restore({ ...row });
	}

	async findByEmail(restaurantId: string, email: string): Promise<Operator | null> {
		const normalized = email.trim().toLowerCase();

		for (const row of this.rows.values()) {
			if (row.restaurantId === restaurantId && row.email.toLowerCase() === normalized) {
				return Operator.restore({ ...row });
			}
		}

		return null;
	}

	async countByRestaurant(restaurantId: string): Promise<number> {
		let total = 0;

		for (const row of this.rows.values()) {
			if (row.restaurantId === restaurantId) {
				total += 1;
			}
		}

		return total;
	}
}
