import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export function createPrismaClient(connectionString: string): PrismaClient {
	const adapter = new PrismaPg({ connectionString });

	return new PrismaClient({ adapter });
}

export const UNIQUE_VIOLATION = 'P2002';

export function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: unknown }).code === UNIQUE_VIOLATION
	);
}
