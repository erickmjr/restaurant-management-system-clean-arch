import jwt from 'jsonwebtoken';
import type {
	AuthenticatedOperator,
	TokenIssuer,
} from '../../application/ports/tokenIssuer.port.js';
import { InvalidTokenError } from '../../domain/errors/operator.errors.js';
import { ROLE_VALUES, type RoleValue } from '../../domain/valueObjects/role.vo.js';

interface TokenClaims {
	sub: string;
	restaurantId: string;
	role: string;
}

export class JwtTokenIssuer implements TokenIssuer {
	constructor(
		private readonly secret: string,
		private readonly expiresIn: string,
	) {}

	async issue(payload: AuthenticatedOperator): Promise<string> {
		const claims: TokenClaims = {
			sub: payload.operatorId,
			restaurantId: payload.restaurantId,
			role: payload.role,
		};

		return jwt.sign(claims, this.secret, {
			expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
		});
	}

	async verify(token: string): Promise<AuthenticatedOperator> {
		let decoded: unknown;

		try {
			decoded = jwt.verify(token, this.secret);
		} catch {
			throw new InvalidTokenError();
		}

		if (typeof decoded !== 'object' || decoded === null) {
			throw new InvalidTokenError();
		}

		const claims = decoded as Partial<TokenClaims>;

		if (
			typeof claims.sub !== 'string' ||
			typeof claims.restaurantId !== 'string' ||
			typeof claims.role !== 'string' ||
			!ROLE_VALUES.includes(claims.role as RoleValue)
		) {
			throw new InvalidTokenError();
		}

		return {
			operatorId: claims.sub,
			restaurantId: claims.restaurantId,
			role: claims.role as RoleValue,
		};
	}
}
