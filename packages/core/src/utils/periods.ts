export const BILLING_PERIODS = {
    minute: 60,
    hour: 60 * 60,
    day: 60 * 60 * 24,
    week: 60 * 60 * 24 * 7,
    month: 60 * 60 * 24 * 30,
    year: 60 * 60 * 24 * 365,
} as const;

export function secondsToPeriod(seconds: bigint | number): string {

    const value = Number(seconds);

    switch (value) {

        case BILLING_PERIODS.minute:
            return "Minute";

        case BILLING_PERIODS.hour:
            return "Hour";

        case BILLING_PERIODS.day:
            return "Day";

        case BILLING_PERIODS.week:
            return "Week";

        case BILLING_PERIODS.month:
            return "Month";

        case BILLING_PERIODS.year:
            return "Year";

        default:
            return `${value} Seconds`;

    }

}

export function periodToSeconds(period: string): bigint {

    const key =
        period.toLowerCase() as keyof typeof BILLING_PERIODS;

    if (!(key in BILLING_PERIODS)) {

        throw new Error(`Unsupported billing period: ${period}`);

    }

    return BigInt(BILLING_PERIODS[key]);

}
