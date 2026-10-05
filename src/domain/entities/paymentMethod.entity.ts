import { EmptyCatalogNameError } from '../errors/catalog.errors.js';

export interface PaymentMethodProps {
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

export class PaymentMethod {
	private constructor(
		private props: PaymentMethodProps,
		private tagIdList: string[],
	) {}

	static create(input: {
		id: string;
		restaurantId: string;
		name: string;
		tagIds?: readonly string[];
		now: Date;
	}): PaymentMethod {
		return new PaymentMethod(
			{
				id: input.id,
				restaurantId: input.restaurantId,
				name: normalizeName(input.name),
				createdAt: input.now,
				updatedAt: input.now,
			},
			[...(input.tagIds ?? [])],
		);
	}

	static restore(props: PaymentMethodProps, tagIds: readonly string[] = []): PaymentMethod {
		return new PaymentMethod({ ...props }, [...tagIds]);
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

	get tagIds(): readonly string[] {
		return this.tagIdList;
	}

	rename(name: string, now: Date): void {
		this.props.name = normalizeName(name);
		this.props.updatedAt = now;
	}

	attachTag(tagId: string, now: Date): void {
		if (this.tagIdList.includes(tagId)) {
			return;
		}

		this.tagIdList.push(tagId);
		this.props.updatedAt = now;
	}

	detachTag(tagId: string, now: Date): void {
		if (!this.tagIdList.includes(tagId)) {
			return;
		}

		this.tagIdList = this.tagIdList.filter((candidate) => candidate !== tagId);
		this.props.updatedAt = now;
	}

	snapshot(): PaymentMethodProps {
		return { ...this.props };
	}
}
