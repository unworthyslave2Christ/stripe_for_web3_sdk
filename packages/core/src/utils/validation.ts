export function requireAddress(
  address: string,
): asserts address is `0x${string}` {
  if (!address.startsWith("0x")) {
    throw new Error("Invalid Ethereum address.");
  }
}

export function requirePositive(
  value: bigint,

  field: string,
) {
  if (value <= 0n) {
    throw new Error(`${field} must be greater than zero.`);
  }
}

export function requireNonEmpty(
  value: string,

  field: string,
) {
  if (!value.trim()) {
    throw new Error(`${field} cannot be empty.`);
  }
}
