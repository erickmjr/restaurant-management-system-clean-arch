import {
	BalanceLockedError,
	EntryNotFoundError,
	ExpenseNotFoundError,
} from '../errors/balance.errors.js';
import type { Competence } from '../valueObjects/competence.vo.js';
import { Money } from '../valueObjects/money.vo.js';
import { Entry } from './entry.entity.js';
import { Expense } from './expense.entity.js';

export const EDIT_WINDOW_IN_DAYS = 3;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface BalanceProps {
	id: string;
	restaurantId: string;
	competence: Competence;
	createdAt: Date;
	updatedAt: Date;
	updatedBy: string;
}

export class Balance {
	private constructor(
		private props: BalanceProps,
		private entryList: Entry[],
		private expenseList: Expense[],
	) {}

	static create(input: {
		id: string;
		restaurantId: string;
		competence: Competence;
		operatorId: string;
		now: Date;
	}): Balance {
		return new Balance(
			{
				id: input.id,
				restaurantId: input.restaurantId,
				competence: input.competence,
				createdAt: input.now,
				updatedAt: input.now,
				updatedBy: input.operatorId,
			},
			[],
			[],
		);
	}

	static restore(input: {
		props: BalanceProps;
		entries: readonly Entry[];
		expenses: readonly Expense[];
	}): Balance {
		return new Balance({ ...input.props }, [...input.entries], [...input.expenses]);
	}

	get id(): string {
		return this.props.id;
	}

	get restaurantId(): string {
		return this.props.restaurantId;
	}

	get competence(): Competence {
		return this.props.competence;
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

	get entries(): readonly Entry[] {
		return this.entryList;
	}

	get expenses(): readonly Expense[] {
		return this.expenseList;
	}

	get lockedAt(): Date {
		return new Date(this.props.createdAt.getTime() + EDIT_WINDOW_IN_DAYS * DAY_IN_MS);
	}

	isLocked(now: Date): boolean {
		return now.getTime() >= this.lockedAt.getTime();
	}

	private assertEditable(now: Date): void {
		if (this.isLocked(now)) {
			throw new BalanceLockedError(this.props.id, this.props.createdAt, now);
		}
	}

	private touch(context: { operatorId: string; now: Date }): void {
		this.props.updatedAt = context.now;
		this.props.updatedBy = context.operatorId;
	}

	private findEntry(entryId: string): Entry {
		const entry = this.entryList.find((candidate) => candidate.id === entryId);

		if (entry === undefined) {
			throw new EntryNotFoundError(entryId);
		}

		return entry;
	}

	private findExpense(expenseId: string): Expense {
		const expense = this.expenseList.find((candidate) => candidate.id === expenseId);

		if (expense === undefined) {
			throw new ExpenseNotFoundError(expenseId);
		}

		return expense;
	}

	registerEntry(input: {
		id: string;
		operatorId: string;
		paymentMethodId: string;
		amount: Money;
		observation?: string | null;
		now: Date;
	}): Entry {
		this.assertEditable(input.now);

		const entry = Entry.createInternal({
			id: input.id,
			balanceId: this.props.id,
			operatorId: input.operatorId,
			paymentMethodId: input.paymentMethodId,
			amount: input.amount,
			observation: input.observation,
			now: input.now,
		});

		this.entryList.push(entry);
		this.touch({ operatorId: input.operatorId, now: input.now });

		return entry;
	}

	registerExpense(input: {
		id: string;
		operatorId: string;
		expenseCategoryId: string;
		amount: Money;
		observation?: string | null;
		now: Date;
	}): Expense {
		this.assertEditable(input.now);

		const expense = Expense.createInternal({
			id: input.id,
			balanceId: this.props.id,
			operatorId: input.operatorId,
			expenseCategoryId: input.expenseCategoryId,
			amount: input.amount,
			observation: input.observation,
			now: input.now,
		});

		this.expenseList.push(expense);
		this.touch({ operatorId: input.operatorId, now: input.now });

		return expense;
	}

	changeEntry(
		entryId: string,
		changes: { amount?: Money; paymentMethodId?: string; observation?: string | null },
		context: { operatorId: string; now: Date },
	): Entry {
		this.assertEditable(context.now);

		const entry = this.findEntry(entryId);

		entry.changeInternal(changes, context);
		this.touch(context);

		return entry;
	}

	removeEntry(entryId: string, context: { operatorId: string; now: Date }): void {
		this.assertEditable(context.now);

		const entry = this.findEntry(entryId);

		this.entryList = this.entryList.filter((candidate) => candidate.id !== entry.id);
		this.touch(context);
	}

	changeExpense(
		expenseId: string,
		changes: { amount?: Money; expenseCategoryId?: string; observation?: string | null },
		context: { operatorId: string; now: Date },
	): Expense {
		this.assertEditable(context.now);

		const expense = this.findExpense(expenseId);

		expense.changeInternal(changes, context);
		this.touch(context);

		return expense;
	}

	removeExpense(expenseId: string, context: { operatorId: string; now: Date }): void {
		this.assertEditable(context.now);

		const expense = this.findExpense(expenseId);

		this.expenseList = this.expenseList.filter((candidate) => candidate.id !== expense.id);
		this.touch(context);
	}

	entryById(entryId: string): Entry | null {
		return this.entryList.find((candidate) => candidate.id === entryId) ?? null;
	}

	expenseById(expenseId: string): Expense | null {
		return this.expenseList.find((candidate) => candidate.id === expenseId) ?? null;
	}

	totalEntries(): Money {
		return Money.sum(this.entryList.map((entry) => entry.amount));
	}

	totalExpenses(): Money {
		return Money.sum(this.expenseList.map((expense) => expense.amount));
	}

	netInCents(): number {
		return this.totalEntries().cents - this.totalExpenses().cents;
	}

	snapshot(): BalanceProps {
		return { ...this.props };
	}
}
