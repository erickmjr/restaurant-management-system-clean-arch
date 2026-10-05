import { InvalidCredentialsError } from '../../domain/errors/operator.errors.js';
import { PasswordHash } from '../../domain/valueObjects/passwordHash.vo.js';
import type {
	AuthenticateOperatorInput,
	AuthenticateOperatorOutput,
} from '../dtos/authenticateOperator.dto.js';
import type { PasswordHasher } from '../ports/passwordHasher.port.js';
import type { TokenIssuer } from '../ports/tokenIssuer.port.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';

const DUMMY_HASH = PasswordHash.restore(
	'$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
);

export class AuthenticateOperatorUseCase {
	constructor(
		private readonly operatorRepository: OperatorRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly tokenIssuer: TokenIssuer,
	) {}

	async execute(input: AuthenticateOperatorInput): Promise<AuthenticateOperatorOutput> {
		const operator = await this.operatorRepository.findByEmail(input.restaurantId, input.email);

		const storedHash = operator === null ? DUMMY_HASH : operator.snapshot().passwordHash;

		const matches = await this.passwordHasher.matches(input.plainPassword, storedHash);

		if (operator === null || !matches) {
			throw new InvalidCredentialsError();
		}

		const token = await this.tokenIssuer.issue({
			operatorId: operator.id,
			restaurantId: operator.restaurantId,
			role: operator.role.raw,
		});

		return {
			token,
			operator: {
				id: operator.id,
				name: operator.name,
				email: operator.email,
				role: operator.role.raw,
				restaurantId: operator.restaurantId,
			},
		};
	}
}
