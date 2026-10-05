import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../../application/ports/idGenerator.port.js';

export class UuidGenerator implements IdGenerator {
	generate(): string {
		return randomUUID();
	}
}

export class SequentialIdGenerator implements IdGenerator {
	private counter = 0;

	constructor(private readonly prefix = 'id') {}

	generate(): string {
		this.counter += 1;

		return `${this.prefix}-${this.counter}`;
	}
}
