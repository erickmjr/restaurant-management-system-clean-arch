import type { RoleValue } from '../../domain/valueObjects/role.vo.js';

export interface AuthenticateOperatorInput {
	restaurantId: string;
	email: string;
	plainPassword: string;
}

export interface AuthenticateOperatorOutput {
	token: string;
	operator: {
		id: string;
		name: string;
		email: string;
		role: RoleValue;
		restaurantId: string;
	};
}
