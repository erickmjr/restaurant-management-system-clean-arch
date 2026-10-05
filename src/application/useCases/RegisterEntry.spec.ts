import { describe, expect, it } from 'vitest';
import { EDIT_WINDOW_IN_DAYS } from '../../domain/entities/balance.entity.js';
import { PaymentMethod } from '../../domain/entities/paymentMethod.entity.js';
import {
	BalanceAlreadyExistsError,
	BalanceLockedError,
	ZeroAmountEntryError,
} from '../../domain/errors/balance.errors.js';
import { PaymentMethodNotFoundError } from '../../domain/errors/catalog.errors.js';
import { FutureCompetenceError } from '../../domain/errors/competence.errors.js';
import { NegativeMoneyError } from '../../domain/errors/money.errors.js';
import { Competence } from '../../domain/valueObjects/competence.vo.js';
import { createInMemoryHarness, type InMemoryHarness } from '../../test/inMemoryAdapters.js';
import type { BalanceRepository } from '../repositories/balance.repository.js';
import { RegisterEntryUseCase } from './RegisterEntry.useCase.js';

const NOW = new Date('2026-03-10T12:00:00.000Z');
const COMPETENCE = '2026-03-10';
const RESTAURANT = 'rest-1';
const OTHER_RESTAURANT = 'rest-2';
const OPERATOR = 'op-1';

function buildUseCase(harness: InMemoryHarness, balanceRepository?: BalanceRepository) {
	return new RegisterEntryUseCase(
		balanceRepository ?? harness.balanceRepository,
		harness.paymentMethodRepository,
		harness.clock,
		harness.adapters.idGenerator,
	);
}

async function seedPaymentMethod(harness: InMemoryHarness, restaurantId: string, id: string) {
	const method = PaymentMethod.restore({
		id,
		restaurantId,
		name: `metodo-${id}`,
		createdAt: NOW,
		updatedAt: NOW,
	});

	await harness.paymentMethodRepository.insert(method);
}

async function setup() {
	const harness = createInMemoryHarness(NOW);

	await seedPaymentMethod(harness, RESTAURANT, 'pm-1');

	return { harness, useCase: buildUseCase(harness) };
}

function entryInput(overrides: Partial<Parameters<RegisterEntryUseCase['execute']>[0]> = {}) {
	return {
		restaurantId: RESTAURANT,
		operatorId: OPERATOR,
		competence: COMPETENCE,
		paymentMethodId: 'pm-1',
		amountInCents: 5000,
		...overrides,
	};
}

describe('RegisterEntryUseCase, caminho feliz', () => {
	it('cria o balanço do dia quando é o primeiro lançamento da competência', async () => {
		const { harness, useCase } = await setup();

		const result = await useCase.execute(entryInput());

		expect(harness.balanceRepository.count()).toBe(1);
		expect(result.competence).toBe(COMPETENCE);
		expect(result.balanceId).toBeTruthy();
		expect(result.entryId).toBeTruthy();
	});

	it('reaproveita o balanço existente no segundo lançamento da mesma competência', async () => {
		const { harness, useCase } = await setup();

		const first = await useCase.execute(entryInput());
		const second = await useCase.execute(entryInput({ amountInCents: 2500 }));

		expect(second.balanceId).toBe(first.balanceId);
		expect(harness.balanceRepository.count()).toBe(1);
	});

	it('soma no total de entradas do balanço', async () => {
		const { harness, useCase } = await setup();

		await useCase.execute(entryInput());
		await useCase.execute(entryInput({ amountInCents: 2500 }));

		const balance = await harness.balanceRepository.findByCompetence(
			RESTAURANT,
			Competence.create(COMPETENCE, NOW),
		);

		expect(balance?.totalEntries().cents).toBe(7500);
		expect(balance?.entries.length).toBe(2);
	});

	it('devolve o lockedAt três dias depois da criação do balanço', async () => {
		const { useCase } = await setup();

		const result = await useCase.execute(entryInput());

		expect(result.balanceLockedAt.toISOString()).toBe('2026-03-13T12:00:00.000Z');
	});

	it('normaliza observação só com espaço para null', async () => {
		const { harness, useCase } = await setup();

		await useCase.execute(entryInput({ observation: '    ' }));

		const balance = await harness.balanceRepository.findByCompetence(
			RESTAURANT,
			Competence.create(COMPETENCE, NOW),
		);

		expect(balance?.entries[0]?.observation).toBeNull();
	});
});

describe('RegisterEntryUseCase, as cinco recusas', () => {
	it('recusa valor negativo, e o erro vem do Money', async () => {
		const { useCase } = await setup();

		await expect(useCase.execute(entryInput({ amountInCents: -1 }))).rejects.toThrow(
			NegativeMoneyError,
		);
	});

	it('recusa valor zero, e o erro vem da Entry', async () => {
		const { useCase } = await setup();

		await expect(useCase.execute(entryInput({ amountInCents: 0 }))).rejects.toThrow(
			ZeroAmountEntryError,
		);
	});

	it('recusa competência no futuro, e o erro vem da Competence', async () => {
		const { useCase } = await setup();

		await expect(useCase.execute(entryInput({ competence: '2026-03-11' }))).rejects.toThrow(
			FutureCompetenceError,
		);
	});

	it('recusa método de pagamento inexistente', async () => {
		const { useCase } = await setup();

		await expect(useCase.execute(entryInput({ paymentMethodId: 'nao-existe' }))).rejects.toThrow(
			PaymentMethodNotFoundError,
		);
	});

	it('recusa método de pagamento de outro restaurante com o mesmo erro do inexistente', async () => {
		const { harness, useCase } = await setup();

		await seedPaymentMethod(harness, OTHER_RESTAURANT, 'pm-alheio');

		await expect(useCase.execute(entryInput({ paymentMethodId: 'pm-alheio' }))).rejects.toThrow(
			PaymentMethodNotFoundError,
		);
	});

	it('não cria balanço nenhum quando a recusa dispara', async () => {
		const { harness, useCase } = await setup();

		await expect(useCase.execute(entryInput({ amountInCents: -1 }))).rejects.toThrow(
			NegativeMoneyError,
		);

		expect(harness.balanceRepository.count()).toBe(0);
	});
});

describe('RegisterEntryUseCase, concorrência na criação do balanço', () => {
	it('quando o insert colide, recarrega o balanço existente e lança nele', async () => {
		const harness = createInMemoryHarness(NOW);

		await seedPaymentMethod(harness, RESTAURANT, 'pm-1');

		const existing = await buildUseCase(harness).execute(
			entryInput({ operatorId: 'outro-operador', amountInCents: 1000 }),
		);

		const real = harness.balanceRepository;
		let firstLookup = true;

		const racing: BalanceRepository = {
			insert: (balance) => real.insert(balance),
			save: (balance) => real.save(balance),
			findByCompetence: async (restaurantId, competence) => {
				if (firstLookup) {
					firstLookup = false;

					return null;
				}

				return real.findByCompetence(restaurantId, competence);
			},
			findById: (restaurantId, balanceId) => real.findById(restaurantId, balanceId),
			findByEntryId: (restaurantId, entryId) => real.findByEntryId(restaurantId, entryId),
			findByExpenseId: (restaurantId, expenseId) => real.findByExpenseId(restaurantId, expenseId),
		};

		const result = await buildUseCase(harness, racing).execute(entryInput({ amountInCents: 4000 }));

		expect(result.balanceId).toBe(existing.balanceId);
		expect(harness.balanceRepository.count()).toBe(1);
	});

	it('o repositório em memória recusa dois balanços da mesma competência, igual o Postgres', async () => {
		const { harness, useCase } = await setup();

		await useCase.execute(entryInput());

		const balance = await harness.balanceRepository.findByCompetence(
			RESTAURANT,
			Competence.create(COMPETENCE, NOW),
		);

		expect(balance).not.toBeNull();

		if (balance === null) {
			return;
		}

		await expect(harness.balanceRepository.insert(balance)).rejects.toThrow(
			BalanceAlreadyExistsError,
		);
	});
});

describe('RegisterEntryUseCase, regra temporal', () => {
	async function registerFirst() {
		const { harness, useCase } = await setup();

		await useCase.execute(entryInput({ amountInCents: 1000 }));

		return { harness, useCase };
	}

	it('aceita lançamento dois dias depois da criação do balanço', async () => {
		const { harness, useCase } = await registerFirst();

		harness.clock.advanceDays(2);

		const result = await useCase.execute(entryInput({ amountInCents: 2000 }));

		expect(result.entryId).toBeTruthy();
	});

	it('recusa exatamente no instante em que a janela fecha', async () => {
		const { harness, useCase } = await registerFirst();

		harness.clock.advanceDays(EDIT_WINDOW_IN_DAYS);

		await expect(useCase.execute(entryInput({ amountInCents: 2000 }))).rejects.toThrow(
			BalanceLockedError,
		);
	});

	it('recusa lançamento no quarto dia depois da criação do balanço', async () => {
		const { harness, useCase } = await registerFirst();

		harness.clock.advanceDays(4);

		await expect(useCase.execute(entryInput({ amountInCents: 2000 }))).rejects.toThrow(
			BalanceLockedError,
		);
	});

	it('conta a janela do createdAt do balanço e não da competência', async () => {
		const { harness, useCase } = await setup();

		harness.clock.advanceDays(30);

		const result = await useCase.execute(entryInput({ amountInCents: 1000 }));

		expect(result.balanceLockedAt.toISOString()).toBe('2026-04-12T12:00:00.000Z');
	});

	it('não move a janela quando o balanço recebe lançamento novo', async () => {
		const { harness, useCase } = await registerFirst();

		harness.clock.advanceDays(2);

		const second = await useCase.execute(entryInput({ amountInCents: 2000 }));

		expect(second.balanceLockedAt.toISOString()).toBe('2026-03-13T12:00:00.000Z');
	});
});

describe('RegisterEntryUseCase, vazamento entre inquilinos', () => {
	it('não encontra o balanço do restaurante A usando o contexto do restaurante B', async () => {
		const { harness, useCase } = await setup();

		await useCase.execute(entryInput());

		const leaked = await harness.balanceRepository.findByCompetence(
			OTHER_RESTAURANT,
			Competence.create(COMPETENCE, NOW),
		);

		expect(leaked).toBeNull();
	});

	it('cria balanços independentes para a mesma competência em restaurantes diferentes', async () => {
		const { harness, useCase } = await setup();

		await seedPaymentMethod(harness, OTHER_RESTAURANT, 'pm-2');

		const first = await useCase.execute(entryInput());
		const second = await useCase.execute(
			entryInput({
				restaurantId: OTHER_RESTAURANT,
				operatorId: 'op-2',
				paymentMethodId: 'pm-2',
				amountInCents: 1000,
			}),
		);

		expect(first.balanceId).not.toBe(second.balanceId);
		expect(harness.balanceRepository.count()).toBe(2);
	});

	it('não alcança o balanço do outro inquilino nem por id', async () => {
		const { harness, useCase } = await setup();

		const created = await useCase.execute(entryInput());

		const leaked = await harness.balanceRepository.findById(OTHER_RESTAURANT, created.balanceId);

		expect(leaked).toBeNull();
	});

	it('não alcança o lançamento do outro inquilino por id de entrada', async () => {
		const { harness, useCase } = await setup();

		const created = await useCase.execute(entryInput());

		const leaked = await harness.balanceRepository.findByEntryId(OTHER_RESTAURANT, created.entryId);

		expect(leaked).toBeNull();
	});
});
