import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
	PORT: z.coerce.number().int().positive().default(3333),
	JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa de pelo menos 16 caracteres.'),
	JWT_EXPIRES_IN: z.string().default('1d'),
	BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
	const parsed = envSchema.safeParse(source);

	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((issue) => `  ${issue.path.join('.')}, ${issue.message}`)
			.join('\n');

		throw new Error(`Configuração inválida.\n${issues}`);
	}

	return parsed.data;
}
