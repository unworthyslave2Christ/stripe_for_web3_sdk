import { encodeFunctionData, type Abi } from "viem";

import billingProtocolAbi from "./abi/Web3BillingProtocol.json";

export const protocolAbi = billingProtocolAbi as Abi;

/*
|--------------------------------------------------------------------------
| Generic encoder
|--------------------------------------------------------------------------
*/

export function encodeProtocolFunction(
  functionName: string,
  args: readonly unknown[] = [],
) {
  return encodeFunctionData({
    abi: protocolAbi,

    functionName,

    args,
  });
}

export const encodeBillingProtocolCall = (
    functionName: any,
    args: any[] = [],
) =>
    encodeFunctionData({
        abi: billingProtocolAbi as any,
        functionName,
        args,
    });




/*
|--------------------------------------------------------------------------
| Merchant
|--------------------------------------------------------------------------
*/

export function encodeCreateMerchant(
  businessName: string,
  metadataURI: string,
) {
  return encodeProtocolFunction(
    "createMerchant",

    [businessName, metadataURI],
  );
}

/*
|--------------------------------------------------------------------------
| Plans
|--------------------------------------------------------------------------
*/

export function encodeCreatePlan(args: readonly unknown[]) {
  return encodeProtocolFunction(
    "createPlan",

    args,
  );
}

export function encodePausePlan(planId: bigint) {
  return encodeProtocolFunction(
    "pausePlan",

    [planId],
  );
}

export function encodeResumePlan(planId: bigint) {
  return encodeProtocolFunction(
    "activatePlan",

    [planId],
  );
}

export function encodeArchivePlan(planId: bigint) {
  return encodeProtocolFunction(
    "archivePlan",

    [planId],
  );
}

/*
|--------------------------------------------------------------------------
| Subscriptions
|--------------------------------------------------------------------------
*/

export function encodeSubscribe(
  planId: bigint,
  smartAccount: `0x${string}`,
  permissionId: string,
) {
  return encodeProtocolFunction(
    "subscribe",

    [planId, smartAccount, permissionId],
  );
}

export function encodePauseSubscription(subscriptionId: bigint) {
  return encodeProtocolFunction(
    "pauseSubscription",

    [subscriptionId],
  );
}

export function encodeResumeSubscription(subscriptionId: bigint) {
  return encodeProtocolFunction(
    "resumeSubscription",

    [subscriptionId],
  );
}

export function encodeCancelSubscription(subscriptionId: bigint) {
  return encodeProtocolFunction(
    "cancelSubscription",

    [subscriptionId],
  );
}
