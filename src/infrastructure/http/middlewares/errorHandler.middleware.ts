import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError, type DomainErrorKind } from '../../../domain/errors/domain.error.js';

const STATUS_BY_KIND: Record<DomainErrorKind, number> = {
	validation: 400,
	unauthenticated: 401,
	forbidden: 403,
	notFound: 404,
	conflict: 409,
	refusal: 422,
};

export const notFoundHandler: RequestHandler = (request, response) => {
	response.status(404).json({
		error: {
			code: 'ROUTE_NOT_FOUND',
			message: `Rota ${request.method} ${request.path} não existe.`,
		},
	});
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
	if (error instanceof DomainError) {
		response.status(STATUS_BY_KIND[error.kind]).json({
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
			},
		});

		return;
	}

	if (error instanceof ZodError) {
		response.status(400).json({
			error: {
				code: 'INVALID_REQUEST',
				message: 'Requisição inválida.',
				details: {
					issues: error.issues.map((issue) => ({
						path: issue.path.join('.'),
						message: issue.message,
					})),
				},
			},
		});

		return;
	}

	console.error('[erro não tratado]', error);

	response.status(500).json({
		error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' },
	});
};
