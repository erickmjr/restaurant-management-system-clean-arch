import type { BalanceView, CashFlowReportView } from '../repositories/query.repositories.js';

export interface GetBalanceByCompetenceInput {
	restaurantId: string;
	competence: string;
}

export type GetBalanceByCompetenceOutput = BalanceView;

export interface GetCashFlowReportInput {
	restaurantId: string;
	from: string;
	to: string;
}

export type GetCashFlowReportOutput = CashFlowReportView;
