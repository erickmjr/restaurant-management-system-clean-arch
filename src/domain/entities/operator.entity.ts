import { EmptyOperatorNameError, InvalidEmailError } from '../errors/operator.errors.js';
import type { PasswordHash } from '../valueObjects/passwordHash.vo.js';
import type { Role } from '../valueObjects/role.vo.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface OperatorProps {
	id: string;
	restaurantId: string;
	name: string;
	email: string;
	passwordHash: PasswordHash;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
}

function normalizeName(name: string): string {
	const trimmed = name.trim();

	if (trimmed.length === 0) {
		throw new EmptyOperatorNameError();
	}

	return trimmed;
}

function normalizeEmail(email: string): string {
	const normalized = email.trim().toLowerCase();

	if (!EMAIL_PATTERN.test(normalized)) {
		throw new InvalidEmailError(email);
	}

	return normalized;
}

export class Operator {
	private constructor(private props: OperatorProps) {}

	static create(input: {
		id: string;
		restaurantId: string;
		name: string;
		email: string;
		passwordHash: PasswordHash;
		role: Role;
		now: Date;
	}): Operator {
		return new Operator({
			id: input.id,
			restaurantId: input.restaurantId,
			name: normalizeName(input.name),
			email: normalizeEmail(input.email),
			passwordHash: input.passwordHash,
			role: input.role,
			createdAt: input.now,
			updatedAt: input.now,
		});
	}

	static restore(props: OperatorProps): Operator {
		return new Operator({ ...props });
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

	get email(): string {
		return this.props.email;
	}

	get role(): Role {
		return this.props.role;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	isOwner(): boolean {
		return this.props.role.isOwner();
	}

	owns(operatorId: string): boolean {
		return this.props.id === operatorId;
	}

	changePassword(passwordHash: PasswordHash, now: Date): void {
		this.props.passwordHash = passwordHash;
		this.props.updatedAt = now;
	}

	snapshot(): OperatorProps {
		return { ...this.props };
	}
}
