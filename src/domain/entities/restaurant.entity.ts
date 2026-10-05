import {
	EmptyRestaurantNameError,
	RestaurantAlreadyDeletedError,
	RestaurantNotDeletedError,
} from '../errors/restaurant.errors.js';

export interface RestaurantProps {
	id: string;
	name: string;
	photo: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

function normalizeName(name: string): string {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		throw new EmptyRestaurantNameError();
	}

	return trimmed;
}

export class Restaurant {
	private constructor(private props: RestaurantProps) {}

	static create(input: { id: string; name: string; photo?: string | null; now: Date }): Restaurant {
		return new Restaurant({
			id: input.id,
			name: normalizeName(input.name),
			photo: input.photo ?? null,
			createdAt: input.now,
			updatedAt: input.now,
			deletedAt: null,
		});
	}

	static restore(props: RestaurantProps): Restaurant {
		return new Restaurant({ ...props });
	}

	get id(): string {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get photo(): string | null {
		return this.props.photo;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get deletedAt(): Date | null {
		return this.props.deletedAt;
	}

	isDeleted(): boolean {
		return this.props.deletedAt !== null;
	}

	rename(name: string, now: Date): void {
		this.props.name = normalizeName(name);
		this.props.updatedAt = now;
	}

	changePhoto(photo: string | null, now: Date): void {
		this.props.photo = photo;
		this.props.updatedAt = now;
	}

	delete(now: Date): void {
		if (this.isDeleted()) {
			throw new RestaurantAlreadyDeletedError(this.props.id);
		}

		this.props.deletedAt = now;
		this.props.updatedAt = now;
	}

	restoreDeleted(now: Date): void {
		if (!this.isDeleted()) {
			throw new RestaurantNotDeletedError(this.props.id);
		}

		this.props.deletedAt = null;
		this.props.updatedAt = now;
	}

	snapshot(): RestaurantProps {
		return { ...this.props };
	}
}
