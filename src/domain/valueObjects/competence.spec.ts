import { describe, expect, it } from 'vitest';
import { FutureCompetenceError, InvalidCompetenceError } from '../errors/competence.errors.js';
import { Competence } from './competence.vo.js';

const NOW = new Date('2026-03-10T23:30:00.000Z');

describe('Competence.create', () => {
	it('aceita uma data passada', () => {
		const competence = Competence.create('2026-03-01', NOW);

		expect(competence.toISODate()).toBe('2026-03-01');
	});

	it('aceita o dia de hoje mesmo faltando meia hora para a meia noite', () => {
		const competence = Competence.create('2026-03-10', NOW);

		expect(competence.toISODate()).toBe('2026-03-10');
	});

	it('usa o dia do fuso do restaurante e não o dia em UTC', () => {
		const duringDinnerService = new Date('2026-03-11T02:00:00.000Z');

		expect(Competence.create('2026-03-10', duringDinnerService).toISODate()).toBe('2026-03-10');
		expect(() => Competence.create('2026-03-11', duringDinnerService)).toThrow(
			FutureCompetenceError,
		);
	});

	it('aceita o dia novo assim que ele começa no fuso do restaurante', () => {
		const justAfterMidnight = new Date('2026-03-11T03:30:00.000Z');

		expect(Competence.create('2026-03-11', justAfterMidnight).toISODate()).toBe('2026-03-11');
	});

	it('aceita competência bem retroativa, porque não existe limite de retroatividade', () => {
		const competence = Competence.create('2019-07-04', NOW);

		expect(competence.toISODate()).toBe('2019-07-04');
	});

	it('normaliza para meia noite UTC, descartando qualquer hora', () => {
		const competence = Competence.create('2026-03-05', NOW);

		expect(competence.date.toISOString()).toBe('2026-03-05T00:00:00.000Z');
	});

	it('recusa o dia seguinte', () => {
		expect(() => Competence.create('2026-03-11', NOW)).toThrow(FutureCompetenceError);
	});

	it('recusa uma competência bem no futuro', () => {
		expect(() => Competence.create('2030-01-01', NOW)).toThrow(FutureCompetenceError);
	});

	it.each([
		['10/03/2026', 'formato brasileiro'],
		['2026-3-5', 'mês e dia sem zero à esquerda'],
		['26-03-10', 'ano com dois dígitos'],
		['2026-03-10T00:00:00Z', 'com hora colada'],
		['abcd-ef-gh', 'letras no lugar de números'],
		['', 'string vazia'],
		['2026-03', 'faltando o dia'],
	])('recusa %s, que é %s', (input) => {
		expect(() => Competence.create(input, NOW)).toThrow(InvalidCompetenceError);
	});

	it.each([
		['2026-02-31', 'trinta e um de fevereiro'],
		['2026-02-30', 'trinta de fevereiro'],
		['2026-04-31', 'trinta e um de abril'],
		['2026-13-01', 'mês treze'],
		['2026-00-10', 'mês zero'],
		['2026-03-32', 'dia trinta e dois'],
		['2026-03-00', 'dia zero'],
	])('recusa %s, que é %s e não existe', (input) => {
		expect(() => Competence.create(input, NOW)).toThrow(InvalidCompetenceError);
	});

	it('aceita vinte e nove de fevereiro em ano bissexto', () => {
		const competence = Competence.create('2024-02-29', NOW);

		expect(competence.toISODate()).toBe('2024-02-29');
	});

	it('recusa vinte e nove de fevereiro em ano não bissexto', () => {
		expect(() => Competence.create('2025-02-29', NOW)).toThrow(InvalidCompetenceError);
	});
});

describe('Competence.restore', () => {
	it('não recusa competência futura, porque linha do banco não pode ser recusada na releitura', () => {
		const competence = Competence.restore(new Date('2030-01-01T00:00:00.000Z'));

		expect(competence.toISODate()).toBe('2030-01-01');
	});

	it('normaliza para meia noite UTC mesmo quando a linha vem com hora', () => {
		const competence = Competence.restore(new Date('2026-03-05T18:45:12.000Z'));

		expect(competence.date.toISOString()).toBe('2026-03-05T00:00:00.000Z');
	});
});

describe('Competence.equals', () => {
	it('considera iguais duas competências do mesmo dia vindas de caminhos diferentes', () => {
		const created = Competence.create('2026-03-05', NOW);
		const restored = Competence.restore(new Date('2026-03-05T18:45:12.000Z'));

		expect(created.equals(restored)).toBe(true);
	});

	it('considera diferentes dois dias diferentes', () => {
		const first = Competence.create('2026-03-05', NOW);
		const second = Competence.create('2026-03-06', NOW);

		expect(first.equals(second)).toBe(false);
	});
});

describe('Competence.date', () => {
	it('devolve uma cópia, para ninguém mutar a competência por fora', () => {
		const competence = Competence.create('2026-03-05', NOW);
		const exposed = competence.date;

		exposed.setUTCFullYear(1999);

		expect(competence.toISODate()).toBe('2026-03-05');
	});
});

describe('Competence.daysUntil', () => {
	it('conta os dias entre duas competências', () => {
		const first = Competence.create('2026-03-01', NOW);
		const second = Competence.create('2026-03-10', NOW);

		expect(first.daysUntil(second)).toBe(9);
	});

	it('devolve negativo quando a outra é anterior', () => {
		const first = Competence.create('2026-03-10', NOW);
		const second = Competence.create('2026-03-01', NOW);

		expect(first.daysUntil(second)).toBe(-9);
	});

	it('atravessa fronteira de mês sem erro', () => {
		const first = Competence.create('2026-02-27', NOW);
		const second = Competence.create('2026-03-02', NOW);

		expect(first.daysUntil(second)).toBe(3);
	});
});
