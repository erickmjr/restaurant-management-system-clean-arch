import { NegativeMoneyError, NonIntegerMoneyError } from '../errors/money.errors.js';

export class Money {
	private constructor(private readonly amountInCents: number) {}

	static fromCents(amountInCents: number): Money {
		if (!Number.isInteger(amountInCents)) throw new NonIntegerMoneyError(amountInCents);

		if (amountInCents < 0) throw new NegativeMoneyError(amountInCents);

		return new Money(amountInCents);
	}

	static zero(): Money {
		return Money.fromCents(0);
	}

	static sum(values: readonly Money[]): Money {
		return values.reduce<Money>((total, value) => total.add(value), Money.zero());
	}

	get cents(): number {
		return this.amountInCents;
	}

	add(other: Money): Money {
		return new Money(this.cents + other.cents);
	}

	subtract(other: Money): Money {
		return Money.fromCents(this.cents - other.cents);
	}

	equals(other: Money): boolean {
		return this.cents === other.cents;
	}
}
