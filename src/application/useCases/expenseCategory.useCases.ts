import { ExpenseCategory } from '../../domain/entities/expenseCategory.entity.js';
import {
	CatalogNameAlreadyInUseError,
	ExpenseCategoryNotFoundError,
} from '../../domain/errors/catalog.errors.js';
import type {
	CatalogItemOutput,
	CreateCatalogItemInput,
	ListCatalogInput,
	RenameCatalogItemInput,
} from '../dtos/catalog.dto.js';
import type { Clock } from '../ports/clock.port.js';
import type { IdGenerator } from '../ports/idGenerator.port.js';
import type { ExpenseCategoryRepository } from '../repositories/catalog.repositories.js';

function toOutput(category: ExpenseCategory): CatalogItemOutput {
	const props = category.snapshot();

	return {
		id: props.id,
		name: props.name,
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
	};
}

export class CreateExpenseCategoryUseCase {
	constructor(
		private readonly expenseCategoryRepository: ExpenseCategoryRepository,
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	async execute(input: CreateCatalogItemInput): Promise<CatalogItemOutput> {
		const now = this.clock.now();

		const existing = await this.expenseCategoryRepository.findByName(
			input.restaurantId,
			input.name,
		);

		if (existing !== null) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		const category = ExpenseCategory.create({
			id: this.idGenerator.generate(),
			restaurantId: input.restaurantId,
			name: input.name,
			now,
		});

		await this.expenseCategoryRepository.insert(category);

		return toOutput(category);
	}
}

export class RenameExpenseCategoryUseCase {
	constructor(
		private readonly expenseCategoryRepository: ExpenseCategoryRepository,
		private readonly clock: Clock,
	) {}

	async execute(input: RenameCatalogItemInput): Promise<CatalogItemOutput> {
		const now = this.clock.now();

		const category = await this.expenseCategoryRepository.findById(
			input.restaurantId,
			input.itemId,
		);

		if (category === null) {
			throw new ExpenseCategoryNotFoundError(input.itemId);
		}

		const collision = await this.expenseCategoryRepository.findByName(
			input.restaurantId,
			input.name,
		);

		if (collision !== null && collision.id !== category.id) {
			throw new CatalogNameAlreadyInUseError(input.name);
		}

		category.rename(input.name, now);

		await this.expenseCategoryRepository.save(category);

		return toOutput(category);
	}
}

export class ListExpenseCategoriesUseCase {
	constructor(private readonly expenseCategoryRepository: ExpenseCategoryRepository) {}

	async execute(input: ListCatalogInput): Promise<CatalogItemOutput[]> {
		const categories = await this.expenseCategoryRepository.listByRestaurant(input.restaurantId);

		return categories.map(toOutput);
	}
}
