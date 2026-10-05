import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import { buildRouter, type RouterDependencies } from './routes/index.routes.js';

export function buildApp(dependencies: RouterDependencies): Express {
	const app = express();

	app.use(express.json({ limit: '100kb' }));

	app.use(buildRouter(dependencies));

	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
