import { PaymentTag } from '../../domain/entities/paymentTag.entity.js';
import {
	CatalogNameAlreadyInUseError,
	PaymentTagNotFoundError,
} from '../../domain/errors/catalog.errors.js';
import type {
	CatalogItemOutput,
	CreateCatalogItemInput,
	ListCatalogInput,
	RenameCatalogItemInput,
} from '../dtos/catalog.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { PaymentTagRepository } from '../repositories/catalog.repositories.js';

function toOutput(tag: PaymentTag): CatalogItemOutput {
	const props = tag.snapshot();

	return {
		id: props.id,
		name: props.name,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
	};
}

export class CreatePaymentTagUseCase {
	constructor(
		private readonly paymentTagRepository: PaymentTagRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: CreateCatalogItemInput): Promise<CatalogItemOutput> {
		const now = this.clock.now();

		const existing = await this.paymentTagRepository.findByName(input.restaurantId, input.name);

		if (existing !== null) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		const tag = PaymentTag.create({
			id: this.idGenerator.generate(),
			restaurantId: input.restaurantId,
			name: input.name,
			now,
		});

		await this.paymentTagRepository.insert(tag);

		return toOutput(tag);
	}
}

export class RenamePaymentTagUseCase {
	constructor(
		private readonly paymentTagRepository: PaymentTagRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: RenameCatalogItemInput): Promise<CatalogItemOutput> {
		const now = this.clock.now();

		const tag = await this.paymentTagRepository.findById(input.restaurantId, input.itemId);

		if (tag === null) {
			throw new PaymentTagNotFoundError(input.itemId);
		}

		const collision = await this.paymentTagRepository.findByName(input.restaurantId, input.name);

		if (collision !== null && collision.id !== tag.id) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		tag.rename(input.name, now);

		await this.paymentTagRepository.save(tag);

		return toOutput(tag);
	}
}

export class ListPaymentTagsUseCase {
	constructor(private readonly paymentTagRepository: PaymentTagRepository) {}

	async execute(input: ListCatalogInput): Promise<CatalogItemOutput[]> {
		const tags = await this.paymentTagRepository.listByRestaurant(input.restaurantId);

		return tags.map(toOutput);
	}
}
