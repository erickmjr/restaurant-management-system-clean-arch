import type { PrismaClient } from '@prisma/client';
import type { Clock } from '../../application/ports/clock.port.js';
import type { IdGenerator } from '../../application/ports/idGenerator.port.js';
import type { PasswordHasher } from '../../application/ports/passwordHasher.port.js';
import type { TokenIssuer } from '../../application/ports/tokenIssuer.port.js';
import type { BalanceRepository } from '../../application/repositories/balance.repository.js';
import type {
	ExpenseCategoryRepository,
	PaymentMethodRepository,
	PaymentTagRepository,
} from '../../application/repositories/catalog.repositories.js';
import type { OperatorRepository } from '../../application/repositories/operator.repository.js';
import type {
	BalanceQueryRepository,
	ReportQueryRepository,
} from '../../application/repositories/query.repositories.js';
import type { RestaurantRepository } from '../../application/repositories/restaurant.repository.js';
import { AuthenticateOperatorUseCase } from '../../application/useCases/AuthenticateOperator.useCase.js';
import {
	CreateExpenseCategoryUseCase,
	ListExpenseCategoriesUseCase,
	RenameExpenseCategoryUseCase,
} from '../../application/useCases/expenseCategory.useCases.js';
import { GetBalanceByCompetenceUseCase } from '../../application/useCases/GetBalanceByCompetence.useCase.js';
import { GetCashFlowReportUseCase } from '../../application/useCases/GetCashFlowReport.useCase.js';
import {
	AttachTagToPaymentMethodUseCase,
	CreatePaymentMethodUseCase,
	DetachTagFromPaymentMethodUseCase,
	ListPaymentMethodsUseCase,
	RenamePaymentMethodUseCase,
} from '../../application/useCases/paymentMethod.useCases.js';
import {
	CreatePaymentTagUseCase,
	ListPaymentTagsUseCase,
	RenamePaymentTagUseCase,
} from '../../application/useCases/paymentTag.useCases.js';
import { RegisterEntryUseCase } from '../../application/useCases/RegisterEntry.useCase.js';
import { RegisterExpenseUseCase } from '../../application/useCases/RegisterExpense.useCase.js';
import { RegisterOperatorUseCase } from '../../application/useCases/RegisterOperator.useCase.js';
import { RegisterRestaurantUseCase } from '../../application/useCases/RegisterRestaurant.useCase.js';
import { RemoveEntryUseCase } from '../../application/useCases/RemoveEntry.useCase.js';
import { RemoveExpenseUseCase } from '../../application/useCases/RemoveExpense.useCase.js';
import { UpdateEntryUseCase } from '../../application/useCases/UpdateEntry.useCase.js';
import { UpdateExpenseUseCase } from '../../application/useCases/UpdateExpense.useCase.js';
import { BcryptPasswordHasher } from '../../infrastructure/adapters/bcryptPasswordHasher.adapter.js';
import { JwtTokenIssuer } from '../../infrastructure/adapters/jwtTokenIssuer.adapter.js';
import { SystemClock } from '../../infrastructure/adapters/systemClock.adapter.js';
import { UuidGenerator } from '../../infrastructure/adapters/uuidGenerator.adapter.js';
import { PrismaBalanceRepository } from '../../infrastructure/database/prisma/repositories/prismaBalance.repository.js';
import {
	PrismaExpenseCategoryRepository,
	PrismaPaymentMethodRepository,
	PrismaPaymentTagRepository,
} from '../../infrastructure/database/prisma/repositories/prismaCatalog.repositories.js';
import { PrismaOperatorRepository } from '../../infrastructure/database/prisma/repositories/prismaOperator.repository.js';
import {
	PrismaBalanceQueryRepository,
	PrismaReportQueryRepository,
} from '../../infrastructure/database/prisma/repositories/prismaQuery.repositories.js';
import { PrismaRestaurantRepository } from '../../infrastructure/database/prisma/repositories/prismaRestaurant.repository.js';
import { BalanceController } from '../../infrastructure/http/controllers/balance.controller.js';
import {
	ExpenseCategoryController,
	PaymentMethodController,
	PaymentTagController,
} from '../../infrastructure/http/controllers/catalog.controller.js';
import { OperatorController } from '../../infrastructure/http/controllers/operator.controller.js';
import { ReportController } from '../../infrastructure/http/controllers/report.controller.js';
import { RestaurantController } from '../../infrastructure/http/controllers/restaurant.controller.js';
import type { RouterDependencies } from '../../infrastructure/http/routes/index.routes.js';

export interface Adapters {
	clock: Clock;
	idGenerator: IdGenerator;
	passwordHasher: PasswordHasher;
	tokenIssuer: TokenIssuer;
	restaurantRepository: RestaurantRepository;
	operatorRepository: OperatorRepository;
	balanceRepository: BalanceRepository;
	paymentMethodRepository: PaymentMethodRepository;
	expenseCategoryRepository: ExpenseCategoryRepository;
	paymentTagRepository: PaymentTagRepository;
	balanceQueryRepository: BalanceQueryRepository;
	reportQueryRepository: ReportQueryRepository;
}

export function buildDependencies(adapters: Adapters): RouterDependencies {
	const registerRestaurant = new RegisterRestaurantUseCase(
		adapters.restaurantRepository,
		adapters.clock,
		adapters.idGenerator,
	);

	const registerOperator = new RegisterOperatorUseCase(
		adapters.operatorRepository,
		adapters.restaurantRepository,
		adapters.passwordHasher,
		adapters.clock,
		adapters.idGenerator,
	);

	const authenticateOperator = new AuthenticateOperatorUseCase(
		adapters.operatorRepository,
		adapters.passwordHasher,
		adapters.tokenIssuer,
	);

	const registerEntry = new RegisterEntryUseCase(
		adapters.balanceRepository,
		adapters.paymentMethodRepository,
		adapters.clock,
		adapters.idGenerator,
	);

	const registerExpense = new RegisterExpenseUseCase(
		adapters.balanceRepository,
		adapters.expenseCategoryRepository,
		adapters.clock,
		adapters.idGenerator,
	);

	const updateEntry = new UpdateEntryUseCase(
		adapters.balanceRepository,
		adapters.operatorRepository,
		adapters.paymentMethodRepository,
		adapters.clock,
	);

	const removeEntry = new RemoveEntryUseCase(
		adapters.balanceRepository,
		adapters.operatorRepository,
		adapters.clock,
	);

	const updateExpense = new UpdateExpenseUseCase(
		adapters.balanceRepository,
		adapters.operatorRepository,
		adapters.expenseCategoryRepository,
		adapters.clock,
	);

	const removeExpense = new RemoveExpenseUseCase(
		adapters.balanceRepository,
		adapters.operatorRepository,
		adapters.clock,
	);

	const getBalanceByCompetence = new GetBalanceByCompetenceUseCase(
		adapters.balanceQueryRepository,
		adapters.clock,
	);

	const getCashFlowReport = new GetCashFlowReportUseCase(adapters.reportQueryRepository);

	return {
		tokenIssuer: adapters.tokenIssuer,
		operatorRepository: adapters.operatorRepository,
		restaurantController: new RestaurantController(registerRestaurant),
		operatorController: new OperatorController(registerOperator, authenticateOperator),
		balanceController: new BalanceController(
			registerEntry,
			registerExpense,
			updateEntry,
			removeEntry,
			updateExpense,
			removeExpense,
			getBalanceByCompetence,
		),
		paymentMethodController: new PaymentMethodController(
			new CreatePaymentMethodUseCase(
				adapters.paymentMethodRepository,
				adapters.clock,
				adapters.idGenerator,
			),
			new RenamePaymentMethodUseCase(adapters.paymentMethodRepository, adapters.clock),
			new ListPaymentMethodsUseCase(adapters.paymentMethodRepository),
			new AttachTagToPaymentMethodUseCase(
				adapters.paymentMethodRepository,
				adapters.paymentTagRepository,
				adapters.clock,
			),
			new DetachTagFromPaymentMethodUseCase(adapters.paymentMethodRepository, adapters.clock),
		),
		expenseCategoryController: new ExpenseCategoryController(
			new CreateExpenseCategoryUseCase(
				adapters.expenseCategoryRepository,
				adapters.clock,
				adapters.idGenerator,
			),
			new RenameExpenseCategoryUseCase(adapters.expenseCategoryRepository, adapters.clock),
			new ListExpenseCategoriesUseCase(adapters.expenseCategoryRepository),
		),
		paymentTagController: new PaymentTagController(
			new CreatePaymentTagUseCase(
				adapters.paymentTagRepository,
				adapters.clock,
				adapters.idGenerator,
			),
			new RenamePaymentTagUseCase(adapters.paymentTagRepository, adapters.clock),
			new ListPaymentTagsUseCase(adapters.paymentTagRepository),
		),
		reportController: new ReportController(getCashFlowReport),
	};
}

export function buildProductionAdapters(
	prisma: PrismaClient,
	config: { jwtSecret: string; jwtExpiresIn: string; bcryptRounds: number },
): Adapters {
	return {
		clock: new SystemClock(),
		idGenerator: new UuidGenerator(),
		passwordHasher: new BcryptPasswordHasher(config.bcryptRounds),
		tokenIssuer: new JwtTokenIssuer(config.jwtSecret, config.jwtExpiresIn),
		restaurantRepository: new PrismaRestaurantRepository(prisma),
		operatorRepository: new PrismaOperatorRepository(prisma),
		balanceRepository: new PrismaBalanceRepository(prisma),
		paymentMethodRepository: new PrismaPaymentMethodRepository(prisma),
		expenseCategoryRepository: new PrismaExpenseCategoryRepository(prisma),
		paymentTagRepository: new PrismaPaymentTagRepository(prisma),
		balanceQueryRepository: new PrismaBalanceQueryRepository(prisma),
		reportQueryRepository: new PrismaReportQueryRepository(prisma),
	};
}
