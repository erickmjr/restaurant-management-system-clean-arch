import { InvalidCompetenceError } from '../../domain/errors/competence.errors.js';
import { ISO_DATE_PATTERN } from '../../domain/valueObjects/competence.vo.js';
import type { GetCashFlowReportInput, GetCashFlowReportOutput } from '../dtos/query.dto.js';
import type { ReportQueryRepository } from '../repositories/query.repositories.js';

export class GetCashFlowReportUseCase {
	constructor(private readonly reportQueryRepository: ReportQueryRepository) {}

	async execute(input: GetCashFlowReportInput): Promise<GetCashFlowReportOutput> {
		if (!ISO_DATE_PATTERN.test(input.from)) {
			throw new InvalidCompetenceError(input.from);
		}

		if (!ISO_DATE_PATTERN.test(input.to)) {
			throw new InvalidCompetenceError(input.to);
		}

		if (input.from > input.to) {
			throw new InvalidCompetenceError({ from: input.from, to: input.to });
		}

		return this.reportQueryRepository.cashFlow(input.restaurantId, input.from, input.to);
	}
}
