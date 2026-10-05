import type { BalanceRepository } from '../../../application/repositories/balance.repository.js';
import { Balance, type BalanceProps } from '../../../domain/entities/balance.entity.js';
import { Entry, type EntryProps } from '../../../domain/entities/entry.entity.js';
import { Expense, type ExpenseProps } from '../../../domain/entities/expense.entity.js';
import { BalanceAlreadyExistsError } from '../../../domain/errors/balance.errors.js';
import type { Competence } from '../../../domain/valueObjects/competence.vo.js';

interface StoredBalance {
	props: BalanceProps;
	entries: EntryProps[];
	expenses: ExpenseProps[];
}

export class InMemoryBalanceRepository implements BalanceRepository {
	private readonly rows = new Map<string, StoredBalance>();

	private competenceKey(restaurantId: string, competence: Competence): string {
		return `${restaurantId}:${competence.date.getTime()}`;
	}

	private store(balance: Balance): void {
		this.rows.set(balance.id, {
			props: balance.snapshot(),
			entries: balance.entries.map((entry) => entry.snapshot()),
			expenses: balance.expenses.map((expense) => expense.snapshot()),
		});
	}

	private rebuild(stored: StoredBalance): Balance {
		return Balance.restore({
			props: { ...stored.props },
			entries: stored.entries.map((props) => Entry.restore({ ...props })),
			expenses: stored.expenses.map((props) => Expense.restore({ ...props })),
		});
	}

	async insert(balance: Balance): Promise<void> {
		const key = this.competenceKey(balance.restaurantId, balance.competence);

		for (const stored of this.rows.values()) {
			if (this.competenceKey(stored.props.restaurantId, stored.props.competence) === key) {
				throw new BalanceAlreadyExistsError(
					balance.restaurantId,
					String(balance.competence.date.getTime()),
				);
			}
		}

		this.store(balance);
	}

	async save(balance: Balance): Promise<void> {
		this.store(balance);
	}

	async findByCompetence(restaurantId: string, competence: Competence): Promise<Balance | null> {
		const key = this.competenceKey(restaurantId, competence);

		for (const stored of this.rows.values()) {
			if (
				stored.props.restaurantId === restaurantId &&
				this.competenceKey(stored.props.restaurantId, stored.props.competence) === key
			) {
				return this.rebuild(stored);
			}
		}

		return null;
	}

	async findById(restaurantId: string, balanceId: string): Promise<Balance | null> {
		const stored = this.rows.get(balanceId);

		if (stored === undefined || stored.props.restaurantId !== restaurantId) {
			return null;
		}

		return this.rebuild(stored);
	}

	async findByEntryId(restaurantId: string, entryId: string): Promise<Balance | null> {
		for (const stored of this.rows.values()) {
			if (stored.props.restaurantId !== restaurantId) {
				continue;
			}

			if (stored.entries.some((entry) => entry.id === entryId)) {
				return this.rebuild(stored);
			}
		}

		return null;
	}

	async findByExpenseId(restaurantId: string, expenseId: string): Promise<Balance | null> {
		for (const stored of this.rows.values()) {
			if (stored.props.restaurantId !== restaurantId) {
				continue;
			}

			if (stored.expenses.some((expense) => expense.id === expenseId)) {
				return this.rebuild(stored);
			}
		}

		return null;
	}

	count(): number {
		return this.rows.size;
	}

	listByRestaurant(restaurantId: string): Balance[] {
		return [...this.rows.values()]
			.filter((stored) => stored.props.restaurantId === restaurantId)
			.map((stored) => this.rebuild(stored))
			.sort((left, right) => left.competence.date.getTime() - right.competence.date.getTime());
	}
}
