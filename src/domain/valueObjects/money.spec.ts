import { describe, expect, it } from 'vitest';
import { NegativeMoneyError, NonIntegerMoneyError } from '../errors/money.errors.js';
import { Money } from './money.vo.js';

describe('Money.fromCents', () => {
	it('aceita zero', () => {
		expect(Money.fromCents(0).cents).toBe(0);
	});

	it('aceita valor positivo', () => {
		expect(Money.fromCents(1050).cents).toBe(1050);
	});

	it.each([-1, -1050])('recusa %i', (value) => {
		expect(() => Money.fromCents(value)).toThrow(NegativeMoneyError);
	});

	it.each([10.5, 0.1, Number.NaN, Number.POSITIVE_INFINITY])('recusa %s', (value) => {
		expect(() => Money.fromCents(value)).toThrow(NonIntegerMoneyError);
	});
});

describe('Money.add', () => {
	it('soma dois valores', () => {
		expect(Money.fromCents(1000).add(Money.fromCents(250)).cents).toBe(1250);
	});

	it('não muta nenhum dos operandos', () => {
		const left = Money.fromCents(1000);
		const right = Money.fromCents(250);

		left.add(right);

		expect(left.cents).toBe(1000);
		expect(right.cents).toBe(250);
	});
});

describe('Money.subtract', () => {
	it('devolve a menos b', () => {
		expect(Money.fromCents(500).subtract(Money.fromCents(200)).cents).toBe(300);
	});

	it('recusa quando o resultado fica negativo, em vez de devolver zero', () => {
		expect(() => Money.fromCents(100).subtract(Money.fromCents(300))).toThrow(NegativeMoneyError);
	});

	it('aceita resultado exatamente zero', () => {
		expect(Money.fromCents(300).subtract(Money.fromCents(300)).cents).toBe(0);
	});

	it.each([
		[500, 200],
		[300, 300],
		[1, 0],
	])('a.subtract(b).add(b) devolve a para %i e %i', (a, b) => {
		const left = Money.fromCents(a);
		const right = Money.fromCents(b);

		expect(left.subtract(right).add(right).equals(left)).toBe(true);
	});
});

describe('Money.sum', () => {
	it('lista vazia dá zero', () => {
		expect(Money.sum([]).cents).toBe(0);
	});

	it('soma a lista inteira', () => {
		const values = [Money.fromCents(100), Money.fromCents(250), Money.fromCents(7)];

		expect(Money.sum(values).cents).toBe(357);
	});
});

describe('Money.equals', () => {
	it('compara por valor e não por identidade', () => {
		expect(Money.fromCents(1000).equals(Money.fromCents(1000))).toBe(true);
		expect(Money.fromCents(1000).equals(Money.fromCents(1001))).toBe(false);
	});
});
