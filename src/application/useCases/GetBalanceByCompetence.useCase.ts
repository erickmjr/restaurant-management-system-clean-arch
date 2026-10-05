import { BalanceNotFoundError } from '../../domain/errors/balance.errors.js';
import type {
	GetBalanceByCompetenceInput,
	GetBalanceByCompetenceOutput,
} from '../dtos/query.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { BalanceQueryRepository } from '../repositories/query.repositories.js';

export class GetBalanceByCompetenceUseCase {
	constructor(
		private readonly balanceQueryRepository: BalanceQueryRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: GetBalanceByCompetenceInput): Promise<GetBalanceByCompetenceOutput> {
		const now = this.clock.now();

		const view = await this.balanceQueryRepository.findByCompetence(
			input.restaurantId,
			input.competence,
			now,
		);

		if (view === null) {
			throw new BalanceNotFoundError({
				restaurantId: input.restaurantId,
				competence: input.competence,
			});
		}

		return view;
	}
}
