import { Balance } from '../../../domain/entities/balance.entity.js';
import { BalanceAlreadyExistsError } from '../../../domain/errors/balance.errors.js';
import type { Competence } from '../../../domain/valueObjects/competence.vo.js';
import type { IdGenerator } from '../../ports/idGenerator.port.js';
import type { BalanceRepository } from '../../repositories/balance.repository.js';

export async function findOrCreateBalance(
	dependencies: {
		balanceRepository: BalanceRepository;
		idGenerator: IdGenerator;
	},
	input: {
		restaurantId: string;
		competence: Competence;
		operatorId: string;
		now: Date;
	},
): Promise<Balance> {
	const existing = await dependencies.balanceRepository.findByCompetence(
		input.restaurantId,
		input.competence,
	);

	if (existing !== null) {
		return existing;
	}

	const created = Balance.create({
		id: dependencies.idGenerator.generate(),
		restaurantId: input.restaurantId,
		competence: input.competence,
		operatorId: input.operatorId,
		now: input.now,
	});

	try {
		await dependencies.balanceRepository.insert(created);

		return created;
	} catch (error) {
		if (!(error instanceof BalanceAlreadyExistsError)) {
			throw error;
		}

		const concurrent = await dependencies.balanceRepository.findByCompetence(
			input.restaurantId,
			input.competence,
		);

		if (concurrent === null) {
			throw error;
		}

		return concurrent;
	}
}
