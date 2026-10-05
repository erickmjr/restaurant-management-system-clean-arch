import { EntryNotFoundError } from '../../domain/errors/balance.errors.js';
import { PaymentMethodNotFoundError } from '../../domain/errors/catalog.errors.js';
import { OperatorNotFoundError } from '../../domain/errors/operator.errors.js';
import { Money } from '../../domain/valueObjects/money.vo.js';
import type { UpdateEntryInput, UpdateEntryOutput } from '../dtos/updateEntry.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { PaymentMethodRepository } from '../repositories/catalog.repositories.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';
import { assertCanMutateLedgerItem } from './shared/assertCanMutateLedgerItem.js';

export class UpdateEntryUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly operatorRepository: OperatorRepository,
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: UpdateEntryInput): Promise<UpdateEntryOutput> {
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

		if (input.paymentMethodId !== undefined) {
			const paymentMethod = await this.paymentMethodRepository.findById(
				input.restaurantId,
				input.paymentMethodId,
			);

			if (paymentMethod === null) {
				throw new PaymentMethodNotFoundError(input.paymentMethodId);
			}
		}

		const entry = balance.changeEntry(
			input.entryId,
			{
				amount:
					input.amountInCents === undefined ? undefined : Money.fromCents(input.amountInCents),
				paymentMethodId: input.paymentMethodId,
				observation: input.observation,
			},
			{ operatorId: input.operatorId, now },
		);

		await this.balanceRepository.save(balance);

		return {
			entryId: entry.id,
			balanceId: balance.id,
			amountInCents: entry.amount.cents,
			paymentMethodId: entry.paymentMethodId,
			observation: entry.observation,
			updatedAt: entry.updatedAt,
			updatedBy: entry.updatedBy,
		};
	}
}
