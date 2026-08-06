export interface MerchantRecord {

    merchantId: number;

    name: string;

    owner: `0x${string}`;

    businessName: string;

    metadataURI: string;

    status: "ACTIVE" | "SUSPENDED";

    createdAt: number;

}