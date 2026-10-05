import { RefusalError, ValidationError } from './domain.error.js';

export class FutureCompetenceError extends RefusalError {
	readonly code = 'COMPETENCE_IN_FUTURE';

	constructor(competence: string, today: string) {
		super('Competência no futuro não é aceita.', { competence, today });
	}
}

export class InvalidCompetenceError extends ValidationError {
	readonly code = 'COMPETENCE_INVALID';

	constructor(received: unknown) {
		super('Competência deve ser uma data no formato AAAA-MM-DD.', { received });
	}
}
