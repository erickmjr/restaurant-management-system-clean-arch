import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildDependencies } from '../../main/factories/container.factory.js';
import { createInMemoryHarness, type InMemoryHarness } from '../../test/inMemoryAdapters.js';
import { buildApp } from './app.js';

const NOW = new Date('2026-03-10T12:00:00.000Z');
const COMPETENCE = '2026-03-10';

describe('app HTTP, borda', () => {
	let harness: InMemoryHarness;
	let app: ReturnType<typeof buildApp>;

	beforeEach(() => {
		harness = createInMemoryHarness(NOW);
		app = buildApp(buildDependencies(harness.adapters));
	});

	it('responde o health check', async () => {
		const response = await request(app).get('/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});

	it('devolve 404 com código próprio para rota que não existe', async () => {
		const response = await request(app).get('/essa-rota-nao-existe');

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
	});

	it('devolve 401 quando não tem token', async () => {
		const response = await request(app).get('/me');

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe('MISSING_TOKEN');
	});

	it('devolve 401 quando o token é lixo', async () => {
		const response = await request(app).get('/me').set('Authorization', 'Bearer nao-e-token');

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe('INVALID_TOKEN');
	});

	it('aceita token válido e devolve o contexto autenticado', async () => {
		const token = await harness.tokenIssuer.issue({
			operatorId: 'op-1',
			restaurantId: 'rest-1',
			role: 'OWNER',
		});

		const response = await request(app).get('/me').set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			operatorId: 'op-1',
			restaurantId: 'rest-1',
			role: 'OWNER',
		});
	});

	it('traduz erro de schema em 400 com a lista de problemas', async () => {
		const response = await request(app).post('/restaurants').send({ name: '' });

		expect(response.status).toBe(400);
		expect(response.body.error.code).toBe('INVALID_REQUEST');
		expect(response.body.error.details.issues.length).toBeGreaterThan(0);
	});

	it('exige papel de dono para criar operador', async () => {
		const token = await harness.tokenIssuer.issue({
			operatorId: 'op-2',
			restaurantId: 'rest-1',
			role: 'EMPLOYEE',
		});

		const response = await request(app)
			.post('/operators')
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Zé',
				email: 'ze@ex.com',
				password: 'senha-longa-o-suficiente',
				role: 'EMPLOYEE',
			});

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe('INSUFFICIENT_ROLE');
	});

	it('recusa valor decimal em centavos antes de chegar no domínio', async () => {
		const token = await harness.tokenIssuer.issue({
			operatorId: 'op-1',
			restaurantId: 'rest-1',
			role: 'EMPLOYEE',
		});

		const response = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: COMPETENCE, paymentMethodId: 'pm-1', amountInCents: 10.5 });

		expect(response.status).toBe(400);
		expect(response.body.error.code).toBe('INVALID_REQUEST');
	});

	it('recusa competência em formato errado', async () => {
		const token = await harness.tokenIssuer.issue({
			operatorId: 'op-1',
			restaurantId: 'rest-1',
			role: 'EMPLOYEE',
		});

		const response = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: '10/03/2026', paymentMethodId: 'pm-1', amountInCents: 1000 });

		expect(response.status).toBe(400);
	});
});

describe('app HTTP, fluxo completo', () => {
	let harness: InMemoryHarness;
	let app: ReturnType<typeof buildApp>;

	beforeEach(() => {
		harness = createInMemoryHarness(NOW);
		app = buildApp(buildDependencies(harness.adapters));
	});

	async function bootstrapRestaurant(name = 'Pizzaria do Zé', email = 'erick@pizzaria.com') {
		const created = await request(app).post('/restaurants').send({ name });

		expect(created.status).toBe(201);

		const restaurantId = created.body.restaurantId as string;

		const owner = await request(app)
			.post(`/restaurants/${restaurantId}/operators/bootstrap`)
			.send({ name: 'Érick', email, password: 'senha-do-dono', role: 'OWNER' });

		expect(owner.status).toBe(201);
		expect(owner.body.passwordHash).toBeUndefined();

		const login = await request(app)
			.post('/auth/login')
			.send({ restaurantId, email, password: 'senha-do-dono' });

		expect(login.status).toBe(200);

		return { restaurantId, email, token: login.body.token as string };
	}

	async function createPaymentMethod(token: string, name: string) {
		const response = await request(app)
			.post('/payment-methods')
			.set('Authorization', `Bearer ${token}`)
			.send({ name });

		expect(response.status).toBe(201);

		return response.body.id as string;
	}

	it('vai de restaurante novo até relatório', async () => {
		const { token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		const entry = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: COMPETENCE, paymentMethodId: cashId, amountInCents: 125000 });

		expect(entry.status).toBe(201);
		expect(entry.body.balanceId).toBeTruthy();

		const category = await request(app)
			.post('/expense-categories')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Fornecedor' });

		expect(category.status).toBe(201);

		const expense = await request(app)
			.post('/expenses')
			.set('Authorization', `Bearer ${token}`)
			.send({
				competence: COMPETENCE,
				expenseCategoryId: category.body.id,
				amountInCents: 40000,
			});

		expect(expense.status).toBe(201);
		expect(expense.body.balanceId).toBe(entry.body.balanceId);

		const balance = await request(app)
			.get(`/balances/${COMPETENCE}`)
			.set('Authorization', `Bearer ${token}`);

		expect(balance.status).toBe(200);
		expect(balance.body.totalEntriesInCents).toBe(125000);
		expect(balance.body.totalExpensesInCents).toBe(40000);
		expect(balance.body.netInCents).toBe(85000);
		expect(balance.body.isLocked).toBe(false);
		expect(balance.body.entries[0].paymentMethodName).toBe('Dinheiro');
		expect(balance.body.expenses[0].expenseCategoryName).toBe('Fornecedor');

		const report = await request(app)
			.get('/reports/cash-flow')
			.query({ from: '2026-03-01', to: '2026-03-31' })
			.set('Authorization', `Bearer ${token}`);

		expect(report.status).toBe(200);
		expect(report.body.netInCents).toBe(85000);
		expect(report.body.days.length).toBe(1);
		expect(report.body.byPaymentMethod[0]).toMatchObject({
			name: 'Dinheiro',
			totalInCents: 125000,
		});
		expect(report.body.byExpenseCategory[0]).toMatchObject({
			name: 'Fornecedor',
			totalInCents: 40000,
		});
	});

	it('recusa repetir o bootstrap do mesmo restaurante', async () => {
		const { restaurantId } = await bootstrapRestaurant();

		const again = await request(app).post(`/restaurants/${restaurantId}/operators/bootstrap`).send({
			name: 'Impostor',
			email: 'impostor@pizzaria.com',
			password: 'senha-do-impostor',
			role: 'OWNER',
		});

		expect(again.status).toBe(403);
		expect(again.body.error.code).toBe('RESTAURANT_ALREADY_BOOTSTRAPPED');
	});

	it('responde igual para senha errada e para email inexistente', async () => {
		const { restaurantId, email } = await bootstrapRestaurant();

		const wrongPassword = await request(app)
			.post('/auth/login')
			.send({ restaurantId, email, password: 'senha-errada' });

		const wrongEmail = await request(app)
			.post('/auth/login')
			.send({ restaurantId, email: 'ninguem@pizzaria.com', password: 'senha-do-dono' });

		expect(wrongPassword.status).toBe(401);
		expect(wrongEmail.status).toBe(401);
		expect(wrongEmail.body.error.code).toBe(wrongPassword.body.error.code);
		expect(wrongEmail.body.error.message).toBe(wrongPassword.body.error.message);
	});

	it('devolve 422 quando a janela de três dias fechou', async () => {
		const { token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		const entry = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: COMPETENCE, paymentMethodId: cashId, amountInCents: 1000 });

		expect(entry.status).toBe(201);

		harness.clock.advanceDays(4);

		const late = await request(app)
			.patch(`/entries/${entry.body.entryId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ amountInCents: 2000 });

		expect(late.status).toBe(422);
		expect(late.body.error.code).toBe('BALANCE_LOCKED');
	});

	it('deixa o dono corrigir e remover lançamento dentro da janela', async () => {
		const { token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		const entry = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: COMPETENCE, paymentMethodId: cashId, amountInCents: 1000 });

		const patched = await request(app)
			.patch(`/entries/${entry.body.entryId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ amountInCents: 3000, observation: 'corrigido' });

		expect(patched.status).toBe(200);
		expect(patched.body.amountInCents).toBe(3000);
		expect(patched.body.observation).toBe('corrigido');

		const removed = await request(app)
			.delete(`/entries/${entry.body.entryId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(removed.status).toBe(204);

		const balance = await request(app)
			.get(`/balances/${COMPETENCE}`)
			.set('Authorization', `Bearer ${token}`);

		expect(balance.body.entries.length).toBe(0);
		expect(balance.body.totalEntriesInCents).toBe(0);
	});

	it('não deixa um restaurante ver o balanço do outro', async () => {
		const first = await bootstrapRestaurant();
		const firstMethod = await createPaymentMethod(first.token, 'Dinheiro');

		await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${first.token}`)
			.send({ competence: COMPETENCE, paymentMethodId: firstMethod, amountInCents: 99000 });

		const second = await bootstrapRestaurant('Outro', 'outra@outro.com');

		const leaked = await request(app)
			.get(`/balances/${COMPETENCE}`)
			.set('Authorization', `Bearer ${second.token}`);

		expect(leaked.status).toBe(404);
		expect(leaked.body.error.code).toBe('BALANCE_NOT_FOUND');
	});

	it('recusa método de pagamento de outro restaurante com 404', async () => {
		const first = await bootstrapRestaurant();
		const firstMethod = await createPaymentMethod(first.token, 'Dinheiro');

		const second = await bootstrapRestaurant('Outro', 'outra@outro.com');

		const response = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${second.token}`)
			.send({ competence: COMPETENCE, paymentMethodId: firstMethod, amountInCents: 1000 });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe('PAYMENT_METHOD_NOT_FOUND');
	});

	it('impede funcionário de mexer em lançamento de outro operador', async () => {
		const { restaurantId, token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		const entry = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${token}`)
			.send({ competence: COMPETENCE, paymentMethodId: cashId, amountInCents: 1000 });

		const employee = await request(app)
			.post('/operators')
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Funcionário',
				email: 'func@pizzaria.com',
				password: 'senha-do-func',
				role: 'EMPLOYEE',
			});

		expect(employee.status).toBe(201);

		const employeeLogin = await request(app)
			.post('/auth/login')
			.send({ restaurantId, email: 'func@pizzaria.com', password: 'senha-do-func' });

		const blocked = await request(app)
			.patch(`/entries/${entry.body.entryId}`)
			.set('Authorization', `Bearer ${employeeLogin.body.token}`)
			.send({ amountInCents: 1 });

		expect(blocked.status).toBe(403);
		expect(blocked.body.error.code).toBe('INSUFFICIENT_ROLE');
	});

	it('deixa funcionário corrigir o lançamento que ele mesmo criou', async () => {
		const { restaurantId, token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		await request(app).post('/operators').set('Authorization', `Bearer ${token}`).send({
			name: 'Funcionário',
			email: 'func@pizzaria.com',
			password: 'senha-do-func',
			role: 'EMPLOYEE',
		});

		const employeeLogin = await request(app)
			.post('/auth/login')
			.send({ restaurantId, email: 'func@pizzaria.com', password: 'senha-do-func' });

		const employeeToken = employeeLogin.body.token as string;

		const entry = await request(app)
			.post('/entries')
			.set('Authorization', `Bearer ${employeeToken}`)
			.send({ competence: COMPETENCE, paymentMethodId: cashId, amountInCents: 1000 });

		expect(entry.status).toBe(201);

		const patched = await request(app)
			.patch(`/entries/${entry.body.entryId}`)
			.set('Authorization', `Bearer ${employeeToken}`)
			.send({ amountInCents: 1500 });

		expect(patched.status).toBe(200);
		expect(patched.body.amountInCents).toBe(1500);
	});

	it('recusa nome de catálogo repetido com 409', async () => {
		const { token } = await bootstrapRestaurant();

		await createPaymentMethod(token, 'Dinheiro');

		const duplicated = await request(app)
			.post('/payment-methods')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'dinheiro' });

		expect(duplicated.status).toBe(409);
		expect(duplicated.body.error.code).toBe('CATALOG_NAME_IN_USE');
	});

	it('anexa e desanexa tag de método de pagamento', async () => {
		const { token } = await bootstrapRestaurant();
		const cashId = await createPaymentMethod(token, 'Dinheiro');

		const tag = await request(app)
			.post('/payment-tags')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'À vista' });

		expect(tag.status).toBe(201);

		const attached = await request(app)
			.post(`/payment-methods/${cashId}/tags`)
			.set('Authorization', `Bearer ${token}`)
			.send({ paymentTagId: tag.body.id });

		expect(attached.status).toBe(200);
		expect(attached.body.tagIds).toEqual([tag.body.id]);

		const detached = await request(app)
			.delete(`/payment-methods/${cashId}/tags/${tag.body.id}`)
			.set('Authorization', `Bearer ${token}`);

		expect(detached.status).toBe(200);
		expect(detached.body.tagIds).toEqual([]);
	});
});
