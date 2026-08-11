# [Click To Read Article on Medium](https://medium.com/@righteousnessbyfaithinjesus/i-wanted-stripe-for-web3-so-i-started-building-it-42445e9ddabc)
 
 # Stripe for Web3 SDK

The Stripe for Web3 SDK enables developers to integrate decentralized recurring subscription billing into Web3 applications with a simple TypeScript API.

Built on ERC-4337 Account Abstraction, the SDK abstracts the complexity of recurring payments, UserOperations, Paymasters, Smart Accounts, and protocol interactions, allowing developers to implement subscription billing with only a few lines of code.

---

## Features

- Merchant onboarding
- Billing plan creation and management
- Customer subscriptions
- Pause, resume and cancel subscriptions
- ERC-4337 Smart Account support
- Paymaster-sponsored transactions
- Wallet balance validation
- Automatic token approvals
- TypeScript-first API
- Framework agnostic

---

## Local Installation

```bash
pnpm add ..\..\stripe-for-web3-sdk-0.2.0.tgz
```

---

## Quick Example

```typescript
import { StripeForWeb3 } from "@stripe-for-web3/sdk";

const billing = new StripeForWeb3({
    walletClient,
    publicClient,
});

await billing.customer.subscribe({
    planId: 1,
});
```

---

## Merchant Operations

The SDK provides helpers for merchant management.

- Create merchant
- Create billing plans
- Update plans
- Pause plans
- Resume plans
- Archive plans

Example:

```typescript
await billing.merchant.createPlan({
    name: "Premium",
    paymentToken,
    amount,
    billingPeriod: "MONTHLY",
});
```

---

## Customer Operations

Customers can manage subscriptions directly from the SDK.

Supported operations include:

- Subscribe
- Pause subscription
- Resume subscription
- Cancel subscription

Example:

```typescript
await billing.customer.cancel(subscriptionId);
```

---

## Account Abstraction

The SDK is built around ERC-4337 Smart Accounts.

Internally it handles:

- UserOperation construction
- Smart Account execution
- Paymaster sponsorship
- Contract interaction
- Transaction confirmation

Developers interact with a clean, high-level API without manually constructing UserOperations.

---

## Supported Components

The SDK interacts with:

- Stripe for Web3 Billing Protocol
- Stripe for Web3 Subscription Module
- Billing Worker
- Merchant Dashboard
- Customer Dashboard

---

## Roadmap

- React SDK
- Vue SDK
- Node SDK
- REST API Client
- Webhook Client
- Analytics SDK
- Reference integrations

---

## Documentation

Comprehensive documentation and integration guides are available in the project documentation.

---

## License

MIT License.
