import { Balance } from '../../../../domain/entities/balance.entity.js';
import { Entry } from '../../../../domain/entities/entry.entity.js';
import { Expense } from '../../../../domain/entities/expense.entity.js';
import { ExpenseCategory } from '../../../../domain/entities/expenseCategory.entity.js';
import { Operator } from '../../../../domain/entities/operator.entity.js';
import { PaymentMethod } from '../../../../domain/entities/paymentMethod.entity.js';
import { PaymentTag } from '../../../../domain/entities/paymentTag.entity.js';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { Competence } from '../../../../domain/valueObjects/competence.vo.js';
import { Money } from '../../../../domain/valueObjects/money.vo.js';
import { PasswordHash } from '../../../../domain/valueObjects/passwordHash.vo.js';
import { Role } from '../../../../domain/valueObjects/role.vo.js';

export interface RestaurantRow {
	id: string;
	name: string;
	photo: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export function toRestaurantDomain(row: RestaurantRow): Restaurant {
	return Restaurant.restore({
		id: row.id,
		name: row.name,
		photo: row.photo,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		deletedAt: row.deletedAt,
	});
}

export function toRestaurantRow(restaurant: Restaurant): RestaurantRow {
	const props = restaurant.snapshot();

	return {
		id: props.id,
		name: props.name,
		photo: props.photo,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		deletedAt: props.deletedAt,
	};
}

export interface OperatorRow {
	id: string;
	restaurantId: string;
	name: string;
	email: string;
	passwordHash: string;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}

export function toOperatorDomain(row: OperatorRow): Operator {
	return Operator.restore({
		id: row.id,
		restaurantId: row.restaurantId,
		name: row.name,
		email: row.email,
		passwordHash: PasswordHash.restore(row.passwordHash),
		role: Role.create(row.role),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	});
}

export function toOperatorRow(operator: Operator): OperatorRow {
	const props = operator.snapshot();

	return {
		id: props.id,
		restaurantId: props.restaurantId,
		name: props.name,
		email: props.email,
		passwordHash: props.passwordHash.reveal(),
		role: props.role.raw,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
	};
}

export interface EntryRow {
	id: string;
	balanceId: string;
	operatorId: string;
	paymentMethodId: string;
	amountInCents: number;
	observation: string | null;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export function toEntryDomain(row: EntryRow): Entry {
	return Entry.restore({
		id: row.id,
		balanceId: row.balanceId,
		operatorId: row.operatorId,
		paymentMethodId: row.paymentMethodId,
		amount: Money.fromCents(row.amountInCents),
		observation: row.observation,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy,
	});
}

export function toEntryRow(entry: Entry): EntryRow {
	const props = entry.snapshot();

	return {
		id: props.id,
		balanceId: props.balanceId,
		operatorId: props.operatorId,
		paymentMethodId: props.paymentMethodId,
		amountInCents: props.amount.cents,
		observation: props.observation,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		updatedBy: props.updatedBy,
	};
}

export interface ExpenseRow {
	id: string;
	balanceId: string;
	operatorId: string;
	expenseCategoryId: string;
	amountInCents: number;
	observation: string | null;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export function toExpenseDomain(row: ExpenseRow): Expense {
	return Expense.restore({
		id: row.id,
		balanceId: row.balanceId,
		operatorId: row.operatorId,
		expenseCategoryId: row.expenseCategoryId,
		amount: Money.fromCents(row.amountInCents),
		observation: row.observation,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy,
	});
}

export function toExpenseRow(expense: Expense): ExpenseRow {
	const props = expense.snapshot();

	return {
		id: props.id,
		balanceId: props.balanceId,
		operatorId: props.operatorId,
		expenseCategoryId: props.expenseCategoryId,
		amountInCents: props.amount.cents,
		observation: props.observation,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		updatedBy: props.updatedBy,
	};
}

export interface BalanceRow {
	id: string;
	restaurantId: string;
	competence: Date;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export function toBalanceDomain(
	row: BalanceRow,
	entries: readonly EntryRow[],
	expenses: readonly ExpenseRow[],
): Balance {
	return Balance.restore({
		props: {
			id: row.id,
			restaurantId: row.restaurantId,
			competence: Competence.restore(row.competence),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			updatedBy: row.updatedBy,
		},
		entries: entries.map(toEntryDomain),
		expenses: expenses.map(toExpenseDomain),
	});
}

export function toBalanceRow(balance: Balance): BalanceRow {
	const props = balance.snapshot();

	return {
		id: props.id,
		restaurantId: props.restaurantId,
		competence: props.competence.date,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		updatedBy: props.updatedBy,
	};
}

export interface CatalogRow {
	id: string;
	restaurantId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export function toPaymentMethodDomain(row: CatalogRow, tagIds: readonly string[]): PaymentMethod {
	return PaymentMethod.restore({ ...row }, tagIds);
}

export function toExpenseCategoryDomain(row: CatalogRow): ExpenseCategory {
	return ExpenseCategory.restore({ ...row });
}

export function toPaymentTagDomain(row: CatalogRow): PaymentTag {
	return PaymentTag.restore({ ...row });
}
