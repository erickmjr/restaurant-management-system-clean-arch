export class PasswordHash {
	private constructor(private readonly value: string) {}

	static restore(hash: string): PasswordHash {
		if (hash.trim().length === 0) {
			throw new Error('PasswordHash não pode ser vazio.');
		}

		return new PasswordHash(hash);
	}

	reveal(): string {
		return this.value;
	}

	toJSON(): string {
		return '[REDACTED]';
	}

	toString(): string {
		return '[REDACTED]';
	}
}
