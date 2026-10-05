import type { Clock } from '../../application/ports/clock.port.js';

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}

export class FixedClock implements Clock {
	constructor(private current: Date) {}

	now(): Date {
		return new Date(this.current.getTime());
	}

	advanceDays(days: number): void {
		this.current = new Date(this.current.getTime() + days * 24 * 60 * 60 * 1000);
	}

	set(instant: Date): void {
		this.current = new Date(instant.getTime());
	}
}
