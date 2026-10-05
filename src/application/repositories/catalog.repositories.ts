import type { ExpenseCategory } from '../../domain/entities/expenseCategory.entity.js';
import type { PaymentMethod } from '../../domain/entities/paymentMethod.entity.js';
import type { PaymentTag } from '../../domain/entities/paymentTag.entity.js';

export interface PaymentMethodRepository {
	insert(paymentMethod: PaymentMethod): Promise<void>;

	save(paymentMethod: PaymentMethod): Promise<void>;

	findById(restaurantId: string, paymentMethodId: string): Promise<PaymentMethod | null>;

	findByName(restaurantId: string, name: string): Promise<PaymentMethod | null>;

	listByRestaurant(restaurantId: string): Promise<PaymentMethod[]>;
}

export interface ExpenseCategoryRepository {
	insert(expenseCategory: ExpenseCategory): Promise<void>;

	save(expenseCategory: ExpenseCategory): Promise<void>;

	findById(restaurantId: string, expenseCategoryId: string): Promise<ExpenseCategory | null>;

	findByName(restaurantId: string, name: string): Promise<ExpenseCategory | null>;

	listByRestaurant(restaurantId: string): Promise<ExpenseCategory[]>;
}

export interface PaymentTagRepository {
	insert(paymentTag: PaymentTag): Promise<void>;

	save(paymentTag: PaymentTag): Promise<void>;

	findById(restaurantId: string, paymentTagId: string): Promise<PaymentTag | null>;

	findByName(restaurantId: string, name: string): Promise<PaymentTag | null>;

	listByRestaurant(restaurantId: string): Promise<PaymentTag[]>;
}
