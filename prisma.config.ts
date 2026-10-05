import process from 'node:process';
import { defineConfig } from 'prisma/config';

try {
	process.loadEnvFile('.env');
} catch {}

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
	},
});
