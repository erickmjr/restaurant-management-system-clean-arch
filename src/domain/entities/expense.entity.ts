import { ZeroAmountExpenseError } from '../errors/balance.errors.js';
import type { Money } from '../valueObjects/money.vo.js';

export interface ExpenseProps {
	id: string;
	balanceId: string;
	operatorId: string;
	expenseCategoryId: string;
	amount: Money;
	observation: string | null;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

function normalizeObservation(observation: string | null | undefined): string | null {
	if (observation === null || observation === undefined) {
		return null;
	}

	const trimmed = observation.trim();

	return trimmed.length === 0 ? null : trimmed;
}

function assertNonZero(amount: Money): Money {
	if (amount.cents === 0) {
		throw new ZeroAmountExpenseError();
	}

	return amount;
}

export class Expense {
	private constructor(private props: ExpenseProps) {}

	static createInternal(input: {
		id: string;
		balanceId: string;
		operatorId: string;
		expenseCategoryId: string;
		amount: Money;
		observation?: string | null;
		now: Date;
	}): Expense {
		return new Expense({
			id: input.id,
			balanceId: input.balanceId,
			operatorId: input.operatorId,
			expenseCategoryId: input.expenseCategoryId,
			amount: assertNonZero(input.amount),
			observation: normalizeObservation(input.observation),
			createdAt: input.now,
			updatedAt: input.now,
			updatedBy: input.operatorId,
		});
	}

	static restore(props: ExpenseProps): Expense {
		return new Expense({ ...props });
	}

	get id(): string {
		return this.props.id;
	}

	get balanceId(): string {
		return this.props.balanceId;
	}

	get operatorId(): string {
		return this.props.operatorId;
	}

	get expenseCategoryId(): string {
		return this.props.expenseCategoryId;
	}

	get amount(): Money {
		return this.props.amount;
	}

	get observation(): string | null {
		return this.props.observation;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get updatedBy(): string {
		return this.props.updatedBy;
	}

	wasCreatedBy(operatorId: string): boolean {
		return this.props.operatorId === operatorId;
	}

	changeInternal(
		changes: {
			amount?: Money;
			expenseCategoryId?: string;
			observation?: string | null;
		},
		context: { operatorId: string; now: Date },
	): void {
		if (changes.amount !== undefined) {
			this.props.amount = assertNonZero(changes.amount);
		}

		if (changes.expenseCategoryId !== undefined) {
			this.props.expenseCategoryId = changes.expenseCategoryId;
		}

		if (changes.observation !== undefined) {
			this.props.observation = normalizeObservation(changes.observation);
		}

		this.props.updatedAt = context.now;
		this.props.updatedBy = context.operatorId;
	}

	snapshot(): ExpenseProps {
		return { ...this.props };
	}
}
