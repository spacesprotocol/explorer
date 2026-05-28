export interface SpacePointer {
    identifier: number;
    block_hash: string;
    txid: string;
    vout: number;
    sptr: string;
    value: number;
    script_pubkey: string;
    data: string | null;
    spent_block_hash: string | null;
    spent_txid: string | null;
    spent_vin: number | null;
    block?: {
        height: number;
        time: number;
    };
}

export interface SptrDelegation {
    identifier: number;
    sptr: string;
    name: string;
    block_hash: string;
    txid: string;
    vout: number;
    revoked: boolean;
    revoked_block_hash: string | null;
    revoked_txid: string | null;
    revoked_vout: number | null;
    block?: {
        height: number;
        time: number;
    };
}

export interface SptrDetails {
    pointer: SpacePointer;
    delegation: SptrDelegation | null;
    is_spent: boolean;
    is_delegated: boolean;
}
