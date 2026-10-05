import { z } from 'zod';
import { ISO_DATE_PATTERN } from '../../../domain/valueObjects/competence.vo.js';

const amountInCents = z
	.number()
	.int('Valor deve ser inteiro em centavos.')
	.nonnegative('Valor não pode ser negativo.');

const isoDate = z.string().regex(ISO_DATE_PATTERN, 'Data deve estar no formato AAAA-MM-DD.');

const observation = z.string().max(500).nullish();

const name = z.string().min(1, 'Nome é obrigatório.').max(120);

export const registerRestaurantSchema = z.object({
	name,
	photo: z.string().url().nullish(),
});

export const registerOperatorSchema = z.object({
	name,
	email: z.string().email('Email inválido.'),
	password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.').max(200),
	role: z.enum(['OWNER', 'EMPLOYEE']),
});

export const authenticateSchema = z.object({
	restaurantId: z.string().min(1),
	email: z.string().email('Email inválido.'),
	password: z.string().min(1),
});

export const registerEntrySchema = z.object({
	competence: isoDate,
	paymentMethodId: z.string().min(1),
	amountInCents,
	observation,
});

export const registerExpenseSchema = z.object({
	competence: isoDate,
	expenseCategoryId: z.string().min(1),
	amountInCents,
	observation,
});

export const updateEntrySchema = z
	.object({
		paymentMethodId: z.string().min(1).optional(),
		amountInCents: amountInCents.optional(),
		observation,
	})
	.refine((body) => Object.keys(body).length > 0, {
		message: 'Informe pelo menos um campo para alterar.',
	});

export const updateExpenseSchema = z
	.object({
		expenseCategoryId: z.string().min(1).optional(),
		amountInCents: amountInCents.optional(),
		observation,
	})
	.refine((body) => Object.keys(body).length > 0, {
		message: 'Informe pelo menos um campo para alterar.',
	});

export const catalogItemSchema = z.object({ name });

export const attachTagSchema = z.object({ paymentTagId: z.string().min(1) });

export const competenceParamSchema = z.object({ competence: isoDate });

export const reportQuerySchema = z
	.object({ from: isoDate, to: isoDate })
	.refine((query) => query.from <= query.to, {
		message: 'A data inicial não pode ser depois da final.',
	});

export const idParamSchema = z.object({ id: z.string().min(1) });
