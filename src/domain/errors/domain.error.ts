export type DomainErrorKind =
	| 'validation'
	| 'refusal'
	| 'notFound'
	| 'conflict'
	| 'unauthenticated'
	| 'forbidden';

export abstract class DomainError extends Error {
	abstract readonly kind: DomainErrorKind;
	abstract readonly code: string;

	readonly details: Readonly<Record<string, unknown>>;

	constructor(message: string, details: Record<string, unknown> = {}) {
		super(message);
		this.name = new.target.name;
		this.details = Object.freeze({ ...details });
	}
}

export abstract class ValidationError extends DomainError {
	readonly kind = 'validation' as const;
}

export abstract class RefusalError extends DomainError {
	readonly kind = 'refusal' as const;
}

export abstract class NotFoundError extends DomainError {
	readonly kind = 'notFound' as const;
}

export abstract class ConflictError extends DomainError {
	readonly kind = 'conflict' as const;
}

export abstract class UnauthenticatedError extends DomainError {
	readonly kind = 'unauthenticated' as const;
}

export abstract class ForbiddenError extends DomainError {
	readonly kind = 'forbidden' as const;
}
