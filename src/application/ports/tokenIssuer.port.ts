import type { RoleValue } from '../../domain/valueObjects/role.vo.js';

export interface AuthenticatedOperator {
	operatorId: string;
	restaurantId: string;
	role: RoleValue;
}

export interface TokenIssuer {
	issue(payload: AuthenticatedOperator): Promise<string>;

	verify(token: string): Promise<AuthenticatedOperator>;
}
