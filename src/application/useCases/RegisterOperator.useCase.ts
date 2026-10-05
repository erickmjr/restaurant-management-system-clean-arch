import { Operator } from '../../domain/entities/operator.entity.js';
import { EmailAlreadyInUseError, WeakPasswordError } from '../../domain/errors/operator.errors.js';
import { RestaurantNotFoundError } from '../../domain/errors/restaurant.errors.js';
import { Role } from '../../domain/valueObjects/role.vo.js';
import type {
	RegisterOperatorInput,
	RegisterOperatorOutput,
} from '../dtos/registerOperator.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { PasswordHasher } from '../ports/passwordHasher.port.js';
import type { OperatorRepository } from '../repositories/operator.repository.js';
import type { RestaurantRepository } from '../repositories/restaurant.repository.js';

const MINIMUM_PASSWORD_LENGTH = 8;

export class RegisterOperatorUseCase {
	constructor(
		private readonly operatorRepository: OperatorRepository,
		private readonly restaurantRepository: RestaurantRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: RegisterOperatorInput): Promise<RegisterOperatorOutput> {
		const now = this.clock.now();

		const restaurant = await this.restaurantRepository.findById(input.restaurantId);

		if (restaurant === null) {
			throw new RestaurantNotFoundError(input.restaurantId);
		}

		if (input.plainPassword.length < MINIMUM_PASSWORD_LENGTH) {
			throw new WeakPasswordError(MINIMUM_PASSWORD_LENGTH);
		}

		const existing = await this.operatorRepository.findByEmail(input.restaurantId, input.email);

		if (existing !== null) {
			throw new EmailAlreadyInUseError(input.email);
		}

		const passwordHash = await this.passwordHasher.hash(input.plainPassword);

		const operator = Operator.create({
			id: this.idGenerator.generate(),
			restaurantId: input.restaurantId,
			name: input.name,
			email: input.email,
			passwordHash,
			role: Role.create(input.role),
			now,
		});

		await this.operatorRepository.insert(operator);

		return {
			operatorId: operator.id,
			name: operator.name,
			email: operator.email,
			role: operator.role.raw,
			createdAt: operator.createdAt,
		};
	}
}
