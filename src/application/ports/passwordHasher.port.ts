import type { PasswordHash } from '../../domain/valueObjects/passwordHash.vo.js';

export interface PasswordHasher {
	hash(plainPassword: string): Promise<PasswordHash>;

	matches(plainPassword: string, hash: PasswordHash): Promise<boolean>;
}
