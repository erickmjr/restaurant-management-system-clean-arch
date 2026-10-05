import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../application/ports/passwordHasher.port.js';
import { PasswordHash } from '../../domain/valueObjects/passwordHash.vo.js';

export class BcryptPasswordHasher implements PasswordHasher {
	constructor(private readonly rounds = 10) {}

	async hash(plainPassword: string): Promise<PasswordHash> {
		const digest = await bcrypt.hash(plainPassword, this.rounds);

		return PasswordHash.restore(digest);
	}

	async matches(plainPassword: string, hash: PasswordHash): Promise<boolean> {
		return bcrypt.compare(plainPassword, hash.reveal());
	}
}

export class FakePasswordHasher implements PasswordHasher {
	async hash(plainPassword: string): Promise<PasswordHash> {
		return PasswordHash.restore(`hashed:${plainPassword}`);
	}

	async matches(plainPassword: string, hash: PasswordHash): Promise<boolean> {
		return hash.reveal() === `hashed:${plainPassword}`;
	}
}
