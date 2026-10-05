import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthenticatedError,
	ValidationError,
} from './domain.error.js';

export class OperatorNotFoundError extends NotFoundError {
	readonly code = 'OPERATOR_NOT_FOUND';

	constructor(details: Record<string, unknown> = {}) {
		super('Operador não encontrado.', details);
	}
}

export class EmailAlreadyInUseError extends ConflictError {
	readonly code = 'OPERATOR_EMAIL_IN_USE';

	constructor(email: string) {
		super('Já existe operador com este email neste restaurante.', { email });
	}
}

export class InvalidCredentialsError extends UnauthenticatedError {
	readonly code = 'INVALID_CREDENTIALS';

	constructor() {
		super('Email ou senha inválidos.');
	}
}

export class MissingTokenError extends UnauthenticatedError {
	readonly code = 'MISSING_TOKEN';

	constructor() {
		super('Token de autenticação ausente.');
	}
}

export class InvalidTokenError extends UnauthenticatedError {
	readonly code = 'INVALID_TOKEN';

	constructor() {
		super('Token de autenticação inválido ou expirado.');
	}
}

export class InsufficientRoleError extends ForbiddenError {
	readonly code = 'INSUFFICIENT_ROLE';

	constructor(required: string, actual: string) {
		super('Seu papel não permite esta operação.', { required, actual });
	}
}

export class InvalidRoleError extends ValidationError {
	readonly code = 'ROLE_INVALID';

	constructor(received: unknown) {
		super('Papel deve ser dono ou funcionário.', { received });
	}
}

export class EmptyOperatorNameError extends ValidationError {
	readonly code = 'OPERATOR_NAME_EMPTY';

	constructor() {
		super('Nome do operador é obrigatório.');
	}
}

export class InvalidEmailError extends ValidationError {
	readonly code = 'EMAIL_INVALID';

	constructor(received: unknown) {
		super('Email inválido.', { received });
	}
}

export class WeakPasswordError extends ValidationError {
	readonly code = 'PASSWORD_WEAK';

	constructor(minLength: number) {
		super(`Senha deve ter pelo menos ${minLength} caracteres.`, { minLength });
	}
}
