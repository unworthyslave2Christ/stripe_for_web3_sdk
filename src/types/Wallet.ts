export interface WalletBalanceResult {
  token: `0x${string}`;

  symbol: string;

  decimals: number;

  balance: bigint;

  formatted: string;
}
