// src/merchant/MerchantClient.ts

import type { PublicClient, WalletClient } from "viem";

import type { MerchantRecord } from "../types/Merchant";

import type { PlanRecord } from "../types/Plan";

import { createMerchant } from "./createMerchant";

import { createPlan } from "./createPlan";

import { updatePlan } from "./updatePlan";

import { pausePlan } from "./pausePlan";

import { resumePlan } from "./resumePlan";

import { archivePlan } from "./archivePlan";

import { getPlan } from "./getPlan";

import { getPlans } from "./getPlans";
import { MerchantResolver } from "../kernels/getMerchantKernel";

export interface MerchantClientConfig {
  walletClient: WalletClient;

  publicClient: PublicClient;

   merchantResolver: MerchantResolver;

  /**
   * Optional Billing Protocol address.
   * Falls back to the SDK default if omitted.
   */
  contractAddress?: `0x${string}`;

  /**
   * Backend URL used for mirror operations.
   */
  apiUrl?: string;
}

export class MerchantClient {
  readonly walletClient: WalletClient;

  readonly publicClient: PublicClient;

  readonly merchantResolver: MerchantResolver;

  readonly contractAddress?: `0x${string}`;

  readonly apiUrl?: string;

  constructor(config: MerchantClientConfig) {
    this.walletClient = config.walletClient;

    this.publicClient = config.publicClient;

    this.merchantResolver = config.merchantResolver;

    this.contractAddress = config.contractAddress;

    this.apiUrl = config.apiUrl;
  }

  ////////////////////////////////////////////////////////////
  // MERCHANT
  ////////////////////////////////////////////////////////////

  createMerchant(merchant: MerchantRecord) {
    return createMerchant({
      client: this,

      merchant,
    });
  }

  ////////////////////////////////////////////////////////////
  // PLANS
  ////////////////////////////////////////////////////////////

  createPlan(plan: PlanRecord) {
    return createPlan({
      client: this,

      plan,
    });
  }

  updatePlan(
    originalPlan: PlanRecord,

    updatedPlan: PlanRecord,
  ) {
    return updatePlan({
      client: this,

      originalPlan,

      updatedPlan,
    });
  }

  pausePlan(plan: PlanRecord) {
    return pausePlan({
      client: this,

      plan,
    });
  }

  resumePlan(plan: PlanRecord) {
    return resumePlan({
      client: this,

      plan,
    });
  }

  archivePlan(plan: PlanRecord) {
    return archivePlan({
      client: this,

      plan,
    });
  }

  getPlan(planId: number) {
    return getPlan({
      client: this,

      planId,
    });
  }

  getPlans(merchantId: number) {
    return getPlans({
      client: this,

      merchantId,
    });
  }
}
