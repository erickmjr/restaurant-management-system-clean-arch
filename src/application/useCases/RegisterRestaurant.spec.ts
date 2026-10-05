import { describe, expect, it } from 'vitest';
import { EmptyRestaurantNameError } from '../../domain/errors/restaurant.errors.js';
import { createInMemoryHarness } from '../../test/inMemoryAdapters.js';
import { RegisterRestaurantUseCase } from './RegisterRestaurant.useCase.js';

const NOW = new Date('2026-03-10T12:00:00.000Z');

function setup() {
	const harness = createInMemoryHarness(NOW);

	const useCase = new RegisterRestaurantUseCase(
		harness.restaurantRepository,
		harness.clock,
		harness.adapters.idGenerator,
	);

	return { harness, useCase };
}

describe('RegisterRestaurantUseCase', () => {
	it('cria o restaurante e devolve o id gerado', async () => {
		const { harness, useCase } = setup();

		const result = await useCase.execute({ name: 'Pizzaria do Zé' });

		expect(result.restaurantId).toBe('id-1');
		expect(result.name).toBe('Pizzaria do Zé');
		expect(harness.restaurantRepository.count()).toBe(1);
	});

	it('grava o nome com os espaços das pontas aparados', async () => {
		const { harness, useCase } = setup();

		const result = await useCase.execute({ name: '   Boteco   ' });
		const saved = await harness.restaurantRepository.findById(result.restaurantId);

		expect(saved?.name).toBe('Boteco');
	});

	it.each(['', '   ', '\t\n'])('recusa nome vazio ou só espaço', async (name) => {
		const { useCase } = setup();

		await expect(useCase.execute({ name })).rejects.toThrow(EmptyRestaurantNameError);
	});

	it('usa o instante do relógio injetado, sem chamar new Date', async () => {
		const { useCase } = setup();

		const result = await useCase.execute({ name: 'Boteco' });

		expect(result.createdAt.toISOString()).toBe(NOW.toISOString());
	});

	it('nasce sem deletedAt', async () => {
		const { harness, useCase } = setup();

		const result = await useCase.execute({ name: 'Boteco' });
		const saved = await harness.restaurantRepository.findById(result.restaurantId);

		expect(saved?.isDeleted()).toBe(false);
	});

	it('aceita dois restaurantes com o mesmo nome, porque nome não é identidade', async () => {
		const { harness, useCase } = setup();

		const first = await useCase.execute({ name: 'Boteco' });
		const second = await useCase.execute({ name: 'Boteco' });

		expect(first.restaurantId).not.toBe(second.restaurantId);
		expect(harness.restaurantRepository.count()).toBe(2);
	});
});
