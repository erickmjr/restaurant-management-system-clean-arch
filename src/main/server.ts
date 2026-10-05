import { createPrismaClient } from '../infrastructure/database/prisma/client.js';
import { buildApp } from '../infrastructure/http/app.js';
import { loadEnv } from './env.js';
import { buildDependencies, buildProductionAdapters } from './factories/container.factory.js';

const env = loadEnv();

const prisma = createPrismaClient(env.DATABASE_URL);

const adapters = buildProductionAdapters(prisma, {
	jwtSecret: env.JWT_SECRET,
	jwtExpiresIn: env.JWT_EXPIRES_IN,
	bcryptRounds: env.BCRYPT_ROUNDS,
});

const app = buildApp(buildDependencies(adapters));

const server = app.listen(env.PORT, () => {
	console.log(`Servidor ouvindo na porta ${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
	console.log(`Recebi ${signal}, encerrando.`);

	server.close();
	await prisma.$disconnect();

	process.exit(0);
}

process.on('SIGINT', () => {
	void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
	void shutdown('SIGTERM');
});
