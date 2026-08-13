export class StripeForWeb3Error extends Error {

    constructor(message: string) {

        super(message);

        this.name = "StripeForWeb3Error";

    }

}

export class MerchantError extends StripeForWeb3Error {

    constructor(message: string) {

        super(message);

        this.name = "MerchantError";

    }

}

export class PlanError extends StripeForWeb3Error {

    constructor(message: string) {

        super(message);

        this.name = "PlanError";

    }

}

export class SubscriptionError extends StripeForWeb3Error {

    constructor(message: string) {

        super(message);

        this.name = "SubscriptionError";

    }

}

export class WalletError extends StripeForWeb3Error {

    constructor(message: string) {

        super(message);

        this.name = "WalletError";

    }

}

export class TransactionError extends StripeForWeb3Error {

    constructor(message: string) {

        super(message);

        this.name = "TransactionError";

    }

}
