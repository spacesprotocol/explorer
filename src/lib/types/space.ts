export type Vmetaout = {
    block_hash: string;
    txid: string;
    tx_index: number;
    name: string;
    burn_increment: number | null;
    total_burned: number | null;
    value: number | null;
    action: string;
    claim_height: number | null;
    expire_height: number | null;
    reason: string | null;
    script_error: string | null;
    state_root: string | null;
    history_hash: string | null;
    revocation: boolean;
    event_type: 'vmetaout' | 'commitment' | 'delegation' | 'delegation_revocation';
    block_height: number;
    block_time: number;
};

export type SpaceData = {
    latest: Vmetaout | null;
    items: Vmetaout[];
    stats: {
        total: number;
        bidCount: number;
    };
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        itemsPerPage: number;
    };
    currentHeight: number;
};
