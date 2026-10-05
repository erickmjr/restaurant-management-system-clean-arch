import type { Request, Response } from 'express';
import type { GetCashFlowReportUseCase } from '../../../application/useCases/GetCashFlowReport.useCase.js';
import { requireAuth } from '../middlewares/authenticate.middleware.js';
import { reportQuerySchema } from '../schemas/request.schemas.js';

export class ReportController {
	constructor(private readonly getCashFlowReport: GetCashFlowReportUseCase) {}

	cashFlow = async (request: Request, response: Response): Promise<void> => {
		const auth = requireAuth(request);
		const query = reportQuerySchema.parse(request.query);

		const result = await this.getCashFlowReport.execute({
			restaurantId: auth.restaurantId,
			from: query.from,
			to: query.to,
		});

		response.status(200).json(result);
	};
}
