import type { Operator } from '../../../domain/entities/operator.entity.js';
import { InsufficientRoleError } from '../../../domain/errors/operator.errors.js';

export function assertCanMutateLedgerItem(operator: Operator, itemOperatorId: string): void {
	if (operator.isOwner()) {
		return;
	}

	if (operator.owns(itemOperatorId)) {
		return;
	}

	throw new InsufficientRoleError('OWNER', operator.role.raw);
}
