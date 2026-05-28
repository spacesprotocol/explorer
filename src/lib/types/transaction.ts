export interface Transaction {
    txid: string;
    tx_hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    index: number;
    locktime: number;
    fee: number;
    block?: {
        height: number;
        time: number;
        hash?: string;
    };
    confirmations: number;
    input_count: number;
    output_count: number;
    total_output_value: number;
    vmetaouts: TransactionVmetaout[];
    commitments: SpaceCommitment[];
    delegations: SpaceDelegation[];
}

export interface TransactionVmetaout {
    value: number | null;
    name: string | null;
    action: string | null;
    burn_increment: number | null;
    total_burned: number | null;
    claim_height: number | null;
    expire_height: number | null;
    script_error: string | null;
    reason?: string;
    scriptPubKey: string;
    signature?: string;
}

export interface SpaceCommitment {
    name: string;
    state_root: string | null;
    history_hash: string | null;
    revocation: boolean;
}

export interface SpaceDelegation {
    sptr: string;
    name: string;
    vout: number;
}

// TransactionInput and TransactionOutput are no longer stored or returned by the API
// We now only store aggregate counts and totals in the transactions table
// For detailed input/output information, refer users to mempool.space

// export interface TransactionInput {
//     index: number;
//     hash_prevout: string;
//     index_prevout: number;
//     sequence: number;
//     coinbase: string | null;
//     txinwitness: string | null;
//     prev_scriptpubkey?: string;
//     sender_address?: string;
//     prev_value?: number;
// }

// export interface TransactionOutput {
//     index: number;
//     value: number;
//     scriptpubkey: string | null;
//     address: string | null;
//     spender: {
//         txid: string;
//         index: number;
//     } | null;
// }

// export type SpaceAction = {
//     type: 'bid' | 'register' | 'transfer' | 'reserve';
//     value?: number;  // for bids
//     address?: string; // for transfers
//     name: string;  // Name involved in the action
// };
