import { Router } from 'express';
import type { TokenIssuer } from '../../../application/ports/tokenIssuer.port.js';
import type { OperatorRepository } from '../../../application/repositories/operator.repository.js';
import type { BalanceController } from '../controllers/balance.controller.js';
import type {
	ExpenseCategoryController,
	PaymentMethodController,
	PaymentTagController,
} from '../controllers/catalog.controller.js';
import type { OperatorController } from '../controllers/operator.controller.js';
import type { ReportController } from '../controllers/report.controller.js';
import type { RestaurantController } from '../controllers/restaurant.controller.js';
import { authenticate, requireOwner } from '../middlewares/authenticate.middleware.js';
import { bootstrapOnly } from '../middlewares/bootstrapOnly.middleware.js';

export interface RouterDependencies {
	tokenIssuer: TokenIssuer;
	operatorRepository: OperatorRepository;
	restaurantController: RestaurantController;
	operatorController: OperatorController;
	balanceController: BalanceController;
	paymentMethodController: PaymentMethodController;
	expenseCategoryController: ExpenseCategoryController;
	paymentTagController: PaymentTagController;
	reportController: ReportController;
}

export function buildRouter(dependencies: RouterDependencies): Router {
	const router = Router();
	const requireLogin = authenticate(dependencies.tokenIssuer);

	router.get('/health', (_request, response) => {
		response.status(200).json({ status: 'ok' });
	});

	router.post('/restaurants', dependencies.restaurantController.create);

	router.post(
		'/restaurants/:restaurantId/operators/bootstrap',
		bootstrapOnly(dependencies.operatorRepository),
		dependencies.operatorController.bootstrap,
	);

	router.post('/auth/login', dependencies.operatorController.login);

	router.get('/me', requireLogin, dependencies.operatorController.me);

	router.post('/operators', requireLogin, requireOwner, dependencies.operatorController.create);

	router.post('/entries', requireLogin, dependencies.balanceController.createEntry);
	router.patch('/entries/:id', requireLogin, dependencies.balanceController.patchEntry);
	router.delete('/entries/:id', requireLogin, dependencies.balanceController.deleteEntry);

	router.post('/expenses', requireLogin, dependencies.balanceController.createExpense);
	router.patch('/expenses/:id', requireLogin, dependencies.balanceController.patchExpense);
	router.delete('/expenses/:id', requireLogin, dependencies.balanceController.deleteExpense);

	router.get('/balances/:competence', requireLogin, dependencies.balanceController.getByCompetence);

	router.get('/payment-methods', requireLogin, dependencies.paymentMethodController.list);
	router.post(
		'/payment-methods',
		requireLogin,
		requireOwner,
		dependencies.paymentMethodController.create,
	);
	router.patch(
		'/payment-methods/:id',
		requireLogin,
		requireOwner,
		dependencies.paymentMethodController.rename,
	);
	router.post(
		'/payment-methods/:id/tags',
		requireLogin,
		requireOwner,
		dependencies.paymentMethodController.attachTag,
	);
	router.delete(
		'/payment-methods/:id/tags/:tagId',
		requireLogin,
		requireOwner,
		dependencies.paymentMethodController.detachTag,
	);

	router.get('/expense-categories', requireLogin, dependencies.expenseCategoryController.list);
	router.post(
		'/expense-categories',
		requireLogin,
		requireOwner,
		dependencies.expenseCategoryController.create,
	);
	router.patch(
		'/expense-categories/:id',
		requireLogin,
		requireOwner,
		dependencies.expenseCategoryController.rename,
	);

	router.get('/payment-tags', requireLogin, dependencies.paymentTagController.list);
	router.post(
		'/payment-tags',
		requireLogin,
		requireOwner,
		dependencies.paymentTagController.create,
	);
	router.patch(
		'/payment-tags/:id',
		requireLogin,
		requireOwner,
		dependencies.paymentTagController.rename,
	);

	router.get('/reports/cash-flow', requireLogin, dependencies.reportController.cashFlow);

	return router;
}
