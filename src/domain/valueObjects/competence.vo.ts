import { FutureCompetenceError, InvalidCompetenceError } from '../errors/competence.errors.js';

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const BUSINESS_UTC_OFFSET_IN_MINUTES = -180;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function formatISODate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function parseCalendarDate(isoDate: string): Date | null {
	if (!ISO_DATE_PATTERN.test(isoDate)) {
		return null;
	}

	const parts = isoDate.split('-');
	const year = Number(parts[0]);
	const month = Number(parts[1]);
	const day = Number(parts[2]);

	const candidate = new Date(Date.UTC(year, month - 1, day));

	const rolledOver =
		candidate.getUTCFullYear() !== year ||
		candidate.getUTCMonth() !== month - 1 ||
		candidate.getUTCDate() !== day;

	return rolledOver ? null : candidate;
}

function toUtcMidnight(instant: Date): Date {
	return new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()));
}

export function businessDayOf(instant: Date): Date {
	return toUtcMidnight(new Date(instant.getTime() + BUSINESS_UTC_OFFSET_IN_MINUTES * MINUTE_IN_MS));
}

export class Competence {
	private constructor(private readonly value: Date) {}

	static create(isoDate: string, now: Date): Competence {
		const parsed = parseCalendarDate(isoDate);

		if (parsed === null) {
			throw new InvalidCompetenceError(isoDate);
		}

		const today = businessDayOf(now);

		if (parsed.getTime() > today.getTime()) {
			throw new FutureCompetenceError(isoDate, formatISODate(today));
		}

		return new Competence(parsed);
	}

	static restore(value: Date): Competence {
		return new Competence(toUtcMidnight(value));
	}

	get date(): Date {
		return new Date(this.value.getTime());
	}

	toISODate(): string {
		return formatISODate(this.value);
	}

	equals(other: Competence): boolean {
		return this.value.getTime() === other.value.getTime();
	}

	daysUntil(other: Competence): number {
		return Math.round((other.value.getTime() - this.value.getTime()) / DAY_IN_MS);
	}
}
