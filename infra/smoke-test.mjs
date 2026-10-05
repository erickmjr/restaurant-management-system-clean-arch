const API = process.argv[2] ?? 'http://localhost:3333';

async function call(method, path, body, token) {
	const response = await fetch(API + path, {
		method,
		headers: {
			...(body ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	const payload = response.status === 204 ? null : await response.json();

	if (!response.ok) {
		throw new Error(`${method} ${path} devolveu ${response.status} ${JSON.stringify(payload)}`);
	}

	return payload;
}

function businessDay() {
	return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function check(label, actual, expected) {
	if (actual !== expected) {
		throw new Error(`${label}, esperado ${expected} e veio ${actual}`);
	}

	console.log(`ok   ${label}`);
}

const health = await call('GET', '/health');
check('health', health.status, 'ok');

const restaurant = await call('POST', '/restaurants', { name: `Smoke ${Date.now()}` });
console.log(`ok   restaurante ${restaurant.restaurantId}`);

const email = `smoke${Date.now()}@teste.com`;

const owner = await call('POST', `/restaurants/${restaurant.restaurantId}/operators/bootstrap`, {
	name: 'Dono do Smoke',
	email,
	password: 'senha-do-smoke',
	role: 'OWNER',
});
check('papel do dono', owner.role, 'OWNER');
check('hash nao vaza', owner.passwordHash, undefined);

const session = await call('POST', '/auth/login', {
	restaurantId: restaurant.restaurantId,
	email,
	password: 'senha-do-smoke',
});
const token = session.token;
console.log('ok   login');

const method = await call('POST', '/payment-methods', { name: 'Dinheiro' }, token);
const category = await call('POST', '/expense-categories', { name: 'Fornecedor' }, token);
console.log('ok   catalogos');

const competence = businessDay();

const entry = await call(
	'POST',
	'/entries',
	{ competence, paymentMethodId: method.id, amountInCents: 125000 },
	token,
);
check('valor da entrada', entry.amountInCents, 125000);

await call(
	'POST',
	'/expenses',
	{ competence, expenseCategoryId: category.id, amountInCents: 40000 },
	token,
);
console.log('ok   lancamentos');

const balance = await call('GET', `/balances/${competence}`, null, token);
check('total de entradas', balance.totalEntriesInCents, 125000);
check('total de saidas', balance.totalExpensesInCents, 40000);
check('liquido', balance.netInCents, 85000);
check('balanco destravado', balance.isLocked, false);
check('nome do metodo', balance.entries[0].paymentMethodName, 'Dinheiro');
check('nome da categoria', balance.expenses[0].expenseCategoryName, 'Fornecedor');

const report = await call(
	'GET',
	`/reports/cash-flow?from=${competence}&to=${competence}`,
	null,
	token,
);
check('liquido do relatorio', report.netInCents, 85000);
check('dias no relatorio', report.days.length, 1);

const patched = await call(
	'PATCH',
	`/entries/${entry.entryId}`,
	{ amountInCents: 130000 },
	token,
);
check('entrada corrigida', patched.amountInCents, 130000);

await call('DELETE', `/entries/${entry.entryId}`, null, token);
const afterDelete = await call('GET', `/balances/${competence}`, null, token);
check('entrada removida', afterDelete.entries.length, 0);

const futureCompetence = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);
const refused = await fetch(`${API}/entries`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
	body: JSON.stringify({
		competence: futureCompetence,
		paymentMethodId: method.id,
		amountInCents: 1000,
	}),
});
check('competencia futura recusada', refused.status, 422);

console.log('');
console.log(`SMOKE TEST PASSOU em ${API}`);
console.log(`restaurante de teste criado: ${restaurant.restaurantId}`);
