import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type {
	AuthenticatedOperator,
	TokenIssuer,
} from '../../../application/ports/tokenIssuer.port.js';
import {
	InsufficientRoleError,
	MissingTokenError,
} from '../../../domain/errors/operator.errors.js';

export interface RequestWithAuth extends Request {
	auth?: AuthenticatedOperator;
}

export function authenticate(tokenIssuer: TokenIssuer): RequestHandler {
	return async (request: Request, _response: Response, next: NextFunction) => {
		try {
			const header = request.headers.authorization;

			if (header === undefined || !header.startsWith('Bearer ')) {
				throw new MissingTokenError();
			}

			const token = header.slice('Bearer '.length).trim();

			if (token.length === 0) {
				throw new MissingTokenError();
			}

			(request as RequestWithAuth).auth = await tokenIssuer.verify(token);

			next();
		} catch (error) {
			next(error);
		}
	};
}

export const requireOwner: RequestHandler = (request, _response, next) => {
	const auth = (request as RequestWithAuth).auth;

	if (auth === undefined) {
		next(new MissingTokenError());

		return;
	}

	if (auth.role !== 'OWNER') {
		next(new InsufficientRoleError('OWNER', auth.role));

		return;
	}

	next();
};

export function requireAuth(request: Request): AuthenticatedOperator {
	const auth = (request as RequestWithAuth).auth;

	if (auth === undefined) {
		throw new MissingTokenError();
	}

	return auth;
}
