import type { PrismaClient } from '@prisma/client';
import type {
	ExpenseCategoryRepository,
	PaymentMethodRepository,
	PaymentTagRepository,
} from '../../../../application/repositories/catalog.repositories.js';
import type { ExpenseCategory } from '../../../../domain/entities/expenseCategory.entity.js';
import type { PaymentMethod } from '../../../../domain/entities/paymentMethod.entity.js';
import type { PaymentTag } from '../../../../domain/entities/paymentTag.entity.js';
import { CatalogNameAlreadyInUseError } from '../../../../domain/errors/catalog.errors.js';
import { isUniqueViolation } from '../client.js';
import {
	toExpenseCategoryDomain,
	toPaymentMethodDomain,
	toPaymentTagDomain,
} from '../mappers/domain.mappers.js';

export class PrismaPaymentMethodRepository implements PaymentMethodRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(paymentMethod: PaymentMethod): Promise<void> {
		const props = paymentMethod.snapshot();

		try {
			await this.prisma.paymentMethod.create({
				data: {
					...props,
					tags: { create: paymentMethod.tagIds.map((paymentTagId) => ({ paymentTagId })) },
				},
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async save(paymentMethod: PaymentMethod): Promise<void> {
		const props = paymentMethod.snapshot();
		const tagIds = [...paymentMethod.tagIds];

		try {
			await this.prisma.$transaction(async (tx) => {
				await tx.paymentMethod.update({
					where: { id: props.id },
					data: { name: props.name, updatedAt: props.updatedAt },
				});

				await tx.paymentMethodPaymentTag.deleteMany({
					where: { paymentMethodId: props.id, paymentTagId: { notIn: tagIds } },
				});

				for (const paymentTagId of tagIds) {
					await tx.paymentMethodPaymentTag.upsert({
						where: {
							paymentMethodId_paymentTagId: { paymentMethodId: props.id, paymentTagId },
						},
						create: { paymentMethodId: props.id, paymentTagId },
						update: {},
					});
				}
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async findById(restaurantId: string, paymentMethodId: string): Promise<PaymentMethod | null> {
		const row = await this.prisma.paymentMethod.findFirst({
			where: { id: paymentMethodId, restaurantId },
			include: { tags: true },
		});

		return row === null
			? null
			: toPaymentMethodDomain(
					row,
					row.tags.map((tag) => tag.paymentTagId),
				);
	}

	async findByName(restaurantId: string, name: string): Promise<PaymentMethod | null> {
		const row = await this.prisma.paymentMethod.findFirst({
			where: { restaurantId, name: { equals: name.trim(), mode: 'insensitive' } },
			include: { tags: true },
		});

		return row === null
			? null
			: toPaymentMethodDomain(
					row,
					row.tags.map((tag) => tag.paymentTagId),
				);
	}

	async listByRestaurant(restaurantId: string): Promise<PaymentMethod[]> {
		const rows = await this.prisma.paymentMethod.findMany({
			where: { restaurantId },
			include: { tags: true },
			orderBy: { name: 'asc' },
		});

		return rows.map((row) =>
			toPaymentMethodDomain(
				row,
				row.tags.map((tag) => tag.paymentTagId),
			),
		);
	}
}

export class PrismaExpenseCategoryRepository implements ExpenseCategoryRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(expenseCategory: ExpenseCategory): Promise<void> {
		const props = expenseCategory.snapshot();

		try {
			await this.prisma.expenseCategory.create({ data: props });
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async save(expenseCategory: ExpenseCategory): Promise<void> {
		const props = expenseCategory.snapshot();

		try {
			await this.prisma.expenseCategory.update({
				where: { id: props.id },
				data: { name: props.name, updatedAt: props.updatedAt },
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async findById(restaurantId: string, expenseCategoryId: string): Promise<ExpenseCategory | null> {
		const row = await this.prisma.expenseCategory.findFirst({
			where: { id: expenseCategoryId, restaurantId },
		});

		return row === null ? null : toExpenseCategoryDomain(row);
	}

	async findByName(restaurantId: string, name: string): Promise<ExpenseCategory | null> {
		const row = await this.prisma.expenseCategory.findFirst({
			where: { restaurantId, name: { equals: name.trim(), mode: 'insensitive' } },
		});

		return row === null ? null : toExpenseCategoryDomain(row);
	}

	async listByRestaurant(restaurantId: string): Promise<ExpenseCategory[]> {
		const rows = await this.prisma.expenseCategory.findMany({
			where: { restaurantId },
			orderBy: { name: 'asc' },
		});

		return rows.map(toExpenseCategoryDomain);
	}
}

export class PrismaPaymentTagRepository implements PaymentTagRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async insert(paymentTag: PaymentTag): Promise<void> {
		const props = paymentTag.snapshot();

		try {
			await this.prisma.paymentTag.create({ data: props });
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async save(paymentTag: PaymentTag): Promise<void> {
		const props = paymentTag.snapshot();

		try {
			await this.prisma.paymentTag.update({
				where: { id: props.id },
				data: { name: props.name, updatedAt: props.updatedAt },
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new CatalogNameAlreadyInUseError(props.name);
			}

			throw error;
		}
	}

	async findById(restaurantId: string, paymentTagId: string): Promise<PaymentTag | null> {
		const row = await this.prisma.paymentTag.findFirst({
			where: { id: paymentTagId, restaurantId },
		});

		return row === null ? null : toPaymentTagDomain(row);
	}

	async findByName(restaurantId: string, name: string): Promise<PaymentTag | null> {
		const row = await this.prisma.paymentTag.findFirst({
			where: { restaurantId, name: { equals: name.trim(), mode: 'insensitive' } },
		});

		return row === null ? null : toPaymentTagDomain(row);
	}

	async listByRestaurant(restaurantId: string): Promise<PaymentTag[]> {
		const rows = await this.prisma.paymentTag.findMany({
			where: { restaurantId },
			orderBy: { name: 'asc' },
		});

		return rows.map(toPaymentTagDomain);
	}
}
