import { EntryNotFoundError } from '../../domain/errors/balance.errors.js';
import { OperatorNotFoundError } from '../../domain/errors/operator.errors.js';
import type { RemoveEntryInput } from '../dtos/updateEntry.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';
import { assertCanMutateLedgerItem } from './shared/assertCanMutateLedgerItem.js';

export class RemoveEntryUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly operatorRepository: OperatorRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: RemoveEntryInput): Promise<void> {
		const now = this.clock.now();

		const operator = await this.operatorRepository.findById(input.restaurantId, input.operatorId);

		if (operator === null) {
			throw new OperatorNotFoundError({ operatorId: input.operatorId });
		}

		const balance = await this.balanceRepository.findByEntryId(input.restaurantId, input.entryId);

		if (balance === null) {
			throw new EntryNotFoundError(input.entryId);
		}

		const current = balance.entryById(input.entryId);

		if (current === null) {
			throw new EntryNotFoundError(input.entryId);
		}

		assertCanMutateLedgerItem(operator, current.operatorId);

		balance.removeEntry(input.entryId, { operatorId: input.operatorId, now });

		await this.balanceRepository.save(balance);
	}
}
