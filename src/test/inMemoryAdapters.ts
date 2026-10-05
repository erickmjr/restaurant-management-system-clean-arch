import type { AuthenticatedOperator, TokenIssuer } from '../application/ports/tokenIssuer.port.js';
import { InvalidTokenError } from '../domain/errors/operator.errors.js';
import { FakePasswordHasher } from '../infrastructure/adapters/bcryptPasswordHasher.adapter.js';
import { FixedClock } from '../infrastructure/adapters/systemClock.adapter.js';
import { SequentialIdGenerator } from '../infrastructure/adapters/uuidGenerator.adapter.js';
import { InMemoryBalanceRepository } from '../infrastructure/database/inMemory/inMemoryBalance.repository.js';
import {
	InMemoryExpenseCategoryRepository,
	InMemoryPaymentMethodRepository,
	InMemoryPaymentTagRepository,
} from '../infrastructure/database/inMemory/inMemoryCatalog.repositories.js';
import { InMemoryOperatorRepository } from '../infrastructure/database/inMemory/inMemoryOperator.repository.js';
import { InMemoryQueryRepository } from '../infrastructure/database/inMemory/inMemoryQuery.repositories.js';
import { InMemoryRestaurantRepository } from '../infrastructure/database/inMemory/inMemoryRestaurant.repository.js';
import type { Adapters } from '../main/factories/container.factory.js';

export class FakeTokenIssuer implements TokenIssuer {
	async issue(payload: AuthenticatedOperator): Promise<string> {
		return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
	}

	async verify(token: string): Promise<AuthenticatedOperator> {
		try {
			const decoded = JSON.parse(
				Buffer.from(token, 'base64url').toString('utf8'),
			) as AuthenticatedOperator;

			if (typeof decoded.operatorId !== 'string' || typeof decoded.restaurantId !== 'string') {
				throw new InvalidTokenError();
			}

			return decoded;
		} catch {
			throw new InvalidTokenError();
		}
	}
}

export interface InMemoryHarness {
	adapters: Adapters;
	clock: FixedClock;
	restaurantRepository: InMemoryRestaurantRepository;
	operatorRepository: InMemoryOperatorRepository;
	balanceRepository: InMemoryBalanceRepository;
	paymentMethodRepository: InMemoryPaymentMethodRepository;
	expenseCategoryRepository: InMemoryExpenseCategoryRepository;
	paymentTagRepository: InMemoryPaymentTagRepository;
	queryRepository: InMemoryQueryRepository;
	tokenIssuer: FakeTokenIssuer;
}

export function createInMemoryHarness(
	now: Date = new Date('2026-03-10T12:00:00.000Z'),
): InMemoryHarness {
	const clock = new FixedClock(now);
	const restaurantRepository = new InMemoryRestaurantRepository();
	const operatorRepository = new InMemoryOperatorRepository();
	const balanceRepository = new InMemoryBalanceRepository();
	const paymentMethodRepository = new InMemoryPaymentMethodRepository();
	const expenseCategoryRepository = new InMemoryExpenseCategoryRepository();
	const paymentTagRepository = new InMemoryPaymentTagRepository();
	const tokenIssuer = new FakeTokenIssuer();
	const queryRepository = new InMemoryQueryRepository(
		balanceRepository,
		paymentMethodRepository,
		expenseCategoryRepository,
	);

	const adapters: Adapters = {
		clock,
		idGenerator: new SequentialIdGenerator(),
		passwordHasher: new FakePasswordHasher(),
		tokenIssuer,
		restaurantRepository,
		operatorRepository,
		balanceRepository,
		paymentMethodRepository,
		expenseCategoryRepository,
		paymentTagRepository,
		balanceQueryRepository: queryRepository,
		reportQueryRepository: queryRepository,
	};

	return {
		adapters,
		clock,
		restaurantRepository,
		operatorRepository,
		balanceRepository,
		paymentMethodRepository,
		expenseCategoryRepository,
		paymentTagRepository,
		queryRepository,
		tokenIssuer,
	};
}
