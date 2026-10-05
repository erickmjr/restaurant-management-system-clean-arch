import { PaymentMethod } from '../../domain/entities/paymentMethod.entity.js';
import {
	CatalogNameAlreadyInUseError,
	PaymentMethodNotFoundError,
	PaymentTagNotFoundError,
} from '../../domain/errors/catalog.errors.js';
import type {
	ChangePaymentMethodTagInput,
	CreateCatalogItemInput,
	ListCatalogInput,
	PaymentMethodOutput,
	RenameCatalogItemInput,
} from '../dtos/catalog.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type {
	PaymentMethodRepository,
	PaymentTagRepository,
} from '../repositories/catalog.repositories.js';

function toOutput(paymentMethod: PaymentMethod): PaymentMethodOutput {
	const props = paymentMethod.snapshot();

	return {
		id: props.id,
		name: props.name,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
		tagIds: [...paymentMethod.tagIds],
	};
}

export class CreatePaymentMethodUseCase {
	constructor(
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: CreateCatalogItemInput): Promise<PaymentMethodOutput> {
		const now = this.clock.now();

		const existing = await this.paymentMethodRepository.findByName(input.restaurantId, input.name);

		if (existing !== null) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		const paymentMethod = PaymentMethod.create({
			id: this.idGenerator.generate(),
			restaurantId: input.restaurantId,
			name: input.name,
			now,
		});

		await this.paymentMethodRepository.insert(paymentMethod);

		return toOutput(paymentMethod);
	}
}

export class RenamePaymentMethodUseCase {
	constructor(
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: RenameCatalogItemInput): Promise<PaymentMethodOutput> {
		const now = this.clock.now();

		const paymentMethod = await this.paymentMethodRepository.findById(
			input.restaurantId,
			input.itemId,
		);

		if (paymentMethod === null) {
			throw new PaymentMethodNotFoundError(input.itemId);
		}

		const collision = await this.paymentMethodRepository.findByName(input.restaurantId, input.name);

		if (collision !== null && collision.id !== paymentMethod.id) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		paymentMethod.rename(input.name, now);

		await this.paymentMethodRepository.save(paymentMethod);

		return toOutput(paymentMethod);
	}
}

export class AttachTagToPaymentMethodUseCase {
	constructor(
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly paymentTagRepository: PaymentTagRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: ChangePaymentMethodTagInput): Promise<PaymentMethodOutput> {
		const now = this.clock.now();

		const paymentMethod = await this.paymentMethodRepository.findById(
			input.restaurantId,
			input.paymentMethodId,
		);

		if (paymentMethod === null) {
			throw new PaymentMethodNotFoundError(input.paymentMethodId);
		}

		const tag = await this.paymentTagRepository.findById(input.restaurantId, input.paymentTagId);

		if (tag === null) {
			throw new PaymentTagNotFoundError(input.paymentTagId);
		}

		paymentMethod.attachTag(tag.id, now);

		await this.paymentMethodRepository.save(paymentMethod);

		return toOutput(paymentMethod);
	}
}

export class DetachTagFromPaymentMethodUseCase {
	constructor(
		private readonly paymentMethodRepository: PaymentMethodRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: ChangePaymentMethodTagInput): Promise<PaymentMethodOutput> {
		const now = this.clock.now();

		const paymentMethod = await this.paymentMethodRepository.findById(
			input.restaurantId,
			input.paymentMethodId,
		);

		if (paymentMethod === null) {
			throw new PaymentMethodNotFoundError(input.paymentMethodId);
		}

		paymentMethod.detachTag(input.paymentTagId, now);

		await this.paymentMethodRepository.save(paymentMethod);

		return toOutput(paymentMethod);
	}
}

export class ListPaymentMethodsUseCase {
	constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

	async execute(input: ListCatalogInput): Promise<PaymentMethodOutput[]> {
		const methods = await this.paymentMethodRepository.listByRestaurant(input.restaurantId);

		return methods.map(toOutput);
	}
}
