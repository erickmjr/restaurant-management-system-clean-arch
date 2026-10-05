import type { Balance } from '../../domain/entities/balance.entity.js';
import type { Competence } from '../../domain/valueObjects/competence.vo.js';

export interface BalanceRepository {
	insert(balance: Balance): Promise<void>;

	save(balance: Balance): Promise<void>;

	findByCompetence(restaurantId: string, competence: Competence): Promise<Balance | null>;

	findById(restaurantId: string, balanceId: string): Promise<Balance | null>;

	findByEntryId(restaurantId: string, entryId: string): Promise<Balance | null>;

	findByExpenseId(restaurantId: string, expenseId: string): Promise<Balance | null>;
}
