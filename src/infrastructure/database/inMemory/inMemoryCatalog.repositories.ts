import type {
	ExpenseCategoryRepository,
	PaymentMethodRepository,
	PaymentTagRepository,
} from '../../../application/repositories/catalog.repositories.js';
import {
	ExpenseCategory,
	type ExpenseCategoryProps,
} from '../../../domain/entities/expenseCategory.entity.js';
import {
	PaymentMethod,
	type PaymentMethodProps,
} from '../../../domain/entities/paymentMethod.entity.js';
import { PaymentTag, type PaymentTagProps } from '../../../domain/entities/paymentTag.entity.js';

function sameName(left: string, right: string): boolean {
	return left.trim().toLowerCase() === right.trim().toLowerCase();
}

interface StoredPaymentMethod {
	props: PaymentMethodProps;
	tagIds: string[];
}

export class InMemoryPaymentMethodRepository implements PaymentMethodRepository {
	private readonly rows = new Map<string, StoredPaymentMethod>();

	async insert(paymentMethod: PaymentMethod): Promise<void> {
		await this.save(paymentMethod);
	}

	async save(paymentMethod: PaymentMethod): Promise<void> {
		this.rows.set(paymentMethod.id, {
			props: paymentMethod.snapshot(),
			tagIds: [...paymentMethod.tagIds],
		});
	}

	async findById(restaurantId: string, paymentMethodId: string): Promise<PaymentMethod | null> {
		const stored = this.rows.get(paymentMethodId);

		if (stored === undefined || stored.props.restaurantId !== restaurantId) {
			return null;
		}

		return PaymentMethod.restore({ ...stored.props }, [...stored.tagIds]);
	}

	async findByName(restaurantId: string, name: string): Promise<PaymentMethod | null> {
		for (const stored of this.rows.values()) {
			if (stored.props.restaurantId === restaurantId && sameName(stored.props.name, name)) {
				return PaymentMethod.restore({ ...stored.props }, [...stored.tagIds]);
			}
		}

		return null;
	}

	async listByRestaurant(restaurantId: string): Promise<PaymentMethod[]> {
		return [...this.rows.values()]
			.filter((stored) => stored.props.restaurantId === restaurantId)
			.sort((left, right) => left.props.name.localeCompare(right.props.name))
			.map((stored) => PaymentMethod.restore({ ...stored.props }, [...stored.tagIds]));
	}
}

export class InMemoryExpenseCategoryRepository implements ExpenseCategoryRepository {
	private readonly rows = new Map<string, ExpenseCategoryProps>();

	async insert(expenseCategory: ExpenseCategory): Promise<void> {
		await this.save(expenseCategory);
	}

	async save(expenseCategory: ExpenseCategory): Promise<void> {
		this.rows.set(expenseCategory.id, expenseCategory.snapshot());
	}

	async findById(restaurantId: string, expenseCategoryId: string): Promise<ExpenseCategory | null> {
		const row = this.rows.get(expenseCategoryId);

		if (row === undefined || row.restaurantId !== restaurantId) {
			return null;
		}

		return ExpenseCategory.restore({ ...row });
	}

	async findByName(restaurantId: string, name: string): Promise<ExpenseCategory | null> {
		for (const row of this.rows.values()) {
			if (row.restaurantId === restaurantId && sameName(row.name, name)) {
				return ExpenseCategory.restore({ ...row });
			}
		}

		return null;
	}

	async listByRestaurant(restaurantId: string): Promise<ExpenseCategory[]> {
		return [...this.rows.values()]
			.filter((row) => row.restaurantId === restaurantId)
			.sort((left, right) => left.name.localeCompare(right.name))
			.map((row) => ExpenseCategory.restore({ ...row }));
	}
}

export class InMemoryPaymentTagRepository implements PaymentTagRepository {
	private readonly rows = new Map<string, PaymentTagProps>();

	async insert(paymentTag: PaymentTag): Promise<void> {
		await this.save(paymentTag);
	}

	async save(paymentTag: PaymentTag): Promise<void> {
		this.rows.set(paymentTag.id, paymentTag.snapshot());
	}

	async findById(restaurantId: string, paymentTagId: string): Promise<PaymentTag | null> {
		const row = this.rows.get(paymentTagId);

		if (row === undefined || row.restaurantId !== restaurantId) {
			return null;
		}

		return PaymentTag.restore({ ...row });
	}

	async findByName(restaurantId: string, name: string): Promise<PaymentTag | null> {
		for (const row of this.rows.values()) {
			if (row.restaurantId === restaurantId && sameName(row.name, name)) {
				return PaymentTag.restore({ ...row });
			}
		}

		return null;
	}

	async listByRestaurant(restaurantId: string): Promise<PaymentTag[]> {
		return [...this.rows.values()]
			.filter((row) => row.restaurantId === restaurantId)
			.sort((left, right) => left.name.localeCompare(right.name))
			.map((row) => PaymentTag.restore({ ...row }));
	}
}
