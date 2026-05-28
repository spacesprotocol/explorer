export interface AddressStats {
    txCount: number;
    receivedCount: number;
    spentCount: number;
    totalReceived: bigint;
    totalSpent: bigint;
    balance: bigint;
}

export interface AddressData {
    stats: AddressStats;
    transactions: any[]; // Replace with your transaction type
    hasMore: boolean;
    nextCursor?: string;
}
