import { EmptyCatalogNameError } from '../errors/catalog.errors.js';

export interface ExpenseCategoryProps {
	id: string;
	restaurantId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

function normalizeName(name: string): string {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		throw new EmptyCatalogNameError();
	}

	return trimmed;
}

export class ExpenseCategory {
	private constructor(private props: ExpenseCategoryProps) {}

	static create(input: {
		id: string;
		restaurantId: string;
		name: string;
		now: Date;
	}): ExpenseCategory {
		return new ExpenseCategory({
			id: input.id,
			restaurantId: input.restaurantId,
			name: normalizeName(input.name),
			createdAt: input.now,
			updatedAt: input.now,
		});
	}

	static restore(props: ExpenseCategoryProps): ExpenseCategory {
		return new ExpenseCategory({ ...props });
	}

	get id(): string {
		return this.props.id;
	}

	get restaurantId(): string {
		return this.props.restaurantId;
	}

	get name(): string {
		return this.props.name;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	rename(name: string, now: Date): void {
		this.props.name = normalizeName(name);
		this.props.updatedAt = now;
	}

	snapshot(): ExpenseCategoryProps {
		return { ...this.props };
	}
}
