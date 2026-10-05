import type { PrismaClient } from '@prisma/client';
import type { OperatorRepository } from '../../../../application/repositories/operator.repository.js';
import type { Operator } from '../../../../domain/entities/operator.entity.js';
import { EmailAlreadyInUseError } from '../../../../domain/errors/operator.errors.js';
import { isUniqueViolation } from '../client.js';
import { toOperatorDomain, toOperatorRow } from '../mappers/domain.mappers.js';

export class PrismaOperatorRepository implements OperatorRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(operator: Operator): Promise<void> {
		const row = toOperatorRow(operator);

		try {
			await this.prisma.operator.create({
				data: { ...row, role: row.role as 'OWNER' | 'EMPLOYEE' },
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new EmailAlreadyInUseError(row.email);
			}

			throw error;
		}
	}

	async save(operator: Operator): Promise<void> {
		const row = toOperatorRow(operator);

		await this.prisma.operator.update({
			where: { id: row.id },
			data: {
				name: row.name,
				email: row.email,
				passwordHash: row.passwordHash,
				role: row.role as 'OWNER' | 'EMPLOYEE',
				updatedAt: row.updatedAt,
			},
		});
	}

	async findById(restaurantId: string, operatorId: string): Promise<Operator | null> {
		const row = await this.prisma.operator.findFirst({
			where: { id: operatorId, restaurantId },
		});

		return row === null ? null : toOperatorDomain(row);
	}

	async findByEmail(restaurantId: string, email: string): Promise<Operator | null> {
		const row = await this.prisma.operator.findUnique({
			where: { restaurantId_email: { restaurantId, email: email.trim().toLowerCase() } },
		});

		return row === null ? null : toOperatorDomain(row);
	}

	async countByRestaurant(restaurantId: string): Promise<number> {
		return this.prisma.operator.count({ where: { restaurantId } });
	}
}
