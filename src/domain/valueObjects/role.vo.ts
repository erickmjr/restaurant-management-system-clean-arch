import { InvalidRoleError } from '../errors/operator.errors.js';

export const ROLE_VALUES = ['OWNER', 'EMPLOYEE'] as const;

export type RoleValue = (typeof ROLE_VALUES)[number];

function isRoleValue(value: string): value is RoleValue {
	return (ROLE_VALUES as readonly string[]).includes(value);
}

export class Role {
	private constructor(private readonly value: RoleValue) {}

	static owner(): Role {
		return new Role('OWNER');
	}

	static employee(): Role {
		return new Role('EMPLOYEE');
	}

	static create(value: string): Role {
		const normalized = value.trim().toUpperCase();

		if (!isRoleValue(normalized)) {
			throw new InvalidRoleError(value);
		}

		return new Role(normalized);
	}

	get raw(): RoleValue {
		return this.value;
	}

	isOwner(): boolean {
		return this.value === 'OWNER';
	}

	isEmployee(): boolean {
		return this.value === 'EMPLOYEE';
	}

	equals(other: Role): boolean {
		return this.value === other.value;
	}
}
