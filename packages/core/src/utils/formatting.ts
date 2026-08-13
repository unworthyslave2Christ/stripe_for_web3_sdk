import { formatUnits } from "viem";

export function formatTokenAmount(

    amount: bigint,

    decimals: number,

): string {

    return formatUnits(

        amount,

        decimals,

    );

}

export function shortenAddress(

    address: string,

): string {

    return `${address.slice(0, 6)}...${address.slice(-4)}`;

}

export function unixToDate(

    timestamp: number,

): Date {

    return new Date(timestamp * 1000);

}

export function unixToLocaleString(

    timestamp: number,

): string {

    return unixToDate(timestamp).toLocaleString();

}
