import type { RoleValue } from '../../domain/valueObjects/role.vo.js';

export interface RegisterOperatorInput {
	restaurantId: string;
	name: string;
	email: string;
	plainPassword: string;
	role: RoleValue;
}

export interface RegisterOperatorOutput {
	operatorId: string;
	name: string;
	email: string;
	role: RoleValue;
	createdAt: Date;
}
