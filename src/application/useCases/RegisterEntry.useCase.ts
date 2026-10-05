import { PaymentMethodNotFoundError } from '../../domain/errors/catalog.errors.js';
import { Competence } from '../../domain/valueObjects/competence.vo.js';
import { Money } from '../../domain/valueObjects/money.vo.js';
import type { RegisterEntryInput, RegisterEntryOutput } from '../dtos/registerEntry.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import type { PaymentMethodRepository } from '../repositories/catalog.repositories.js';
import { findOrCreateBalance } from './shared/findOrCreateBalance.js';

export class RegisterEntryUseCase {
	constructor(
		private readonly balanceRepository: BalanceRepository,
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: RegisterEntryInput): Promise<RegisterEntryOutput> {
		const now = this.clock.now();

		const competence = Competence.create(input.competence, now);
		const amount = Money.fromCents(input.amountInCents);

		const paymentMethod = await this.paymentMethodRepository.findById(
			input.restaurantId,
			input.paymentMethodId,
		);

		if (paymentMethod === null) {
			throw new PaymentMethodNotFoundError(input.paymentMethodId);
		}

		const balance = await findOrCreateBalance(
			{ balanceRepository: this.balanceRepository, idGenerator: this.idGenerator },
			{
				restaurantId: input.restaurantId,
				competence,
				operatorId: input.operatorId,
				now,
			},
		);

		const entry = balance.registerEntry({
			id: this.idGenerator.generate(),
			operatorId: input.operatorId,
			paymentMethodId: paymentMethod.id,
			amount,
			observation: input.observation ?? null,
			now,
		});

		await this.balanceRepository.save(balance);

		return {
			entryId: entry.id,
			balanceId: balance.id,
			competence: balance.competence.toISODate(),
			amountInCents: entry.amount.cents,
			createdAt: entry.createdAt,
			balanceLockedAt: balance.lockedAt,
		};
	}
}
