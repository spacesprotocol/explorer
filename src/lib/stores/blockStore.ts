import { writable, derived, get } from 'svelte/store';
import type { Transaction } from '$lib/types/transaction';
// import type { Block } from '$lib/types/block';

type BlockState = {
    currentHeight: string | null;
    header: Block | null;
    transactions: Transaction[];
    txCount: number;
    filteredTxCount: number;
    error: string | null;
    onlyWithSpaces: boolean;
    pagination: {
        currentPage: number;
        limit: number;
        offset: number;
    };
    cache: Map<string, {
        header: Block;
        pages: Map<number, Transaction[]>;
        spacesPages: Map<number, Transaction[]>;
    }>;
};

function createBlockStore() {
    const initialState: BlockState = {
        currentHeight: null,
        header: null,
        transactions: [],
        txCount: 0,
        filteredTxCount: 0,
        error: null,
        onlyWithSpaces: false,
        pagination: {
            currentPage: 1,
            limit: 25,
            offset: 0
        },
        cache: new Map()
    };

    const { subscribe, set, update } = writable<BlockState>(initialState);

    return {
        subscribe,
        async fetchBlockData(height: string, page: number = 1, onlyWithSpaces: boolean = false, customFetch: typeof fetch = fetch) {
            update(state => ({ ...state, error: null }));

            const offset = (page - 1) * initialState.pagination.limit;
            const cacheKey = `${height}`;
            const pageKey = page;

            try {
                // Check cache first
                const cachedBlock = get(this).cache.get(cacheKey);
                let blockHeader = cachedBlock?.header;
                let transactions = onlyWithSpaces
                    ? cachedBlock?.spacesPages.get(pageKey)
                    : cachedBlock?.pages.get(pageKey);

                // Fetch header if not cached
                if (!blockHeader) {
                    const headerResponse = await customFetch(`/api/block/${height}/header`);
                    if (!headerResponse.ok) throw new Error(`Error fetching block header: ${headerResponse.statusText}`);
                    blockHeader = await headerResponse.json();
                }

                // Fetch transactions if not cached
                let filteredTxCount = blockHeader.tx_count;
                if (!transactions) {
                    const txsParams = new URLSearchParams({
                        offset: offset.toString(),
                        limit: initialState.pagination.limit.toString(),
                        ...(onlyWithSpaces && { onlyWithSpaces: 'true' })
                    });
                    const txsResponse = await customFetch(`/api/block/${height}/txs?${txsParams}`);
                    if (!txsResponse.ok) throw new Error(`Error fetching block transactions: ${txsResponse.statusText}`);
                    const response = await txsResponse.json();

                    // Handle new API format that returns { transactions, totalCount }
                    if (response.transactions) {
                        transactions = response.transactions;
                        if (onlyWithSpaces && response.totalCount !== null) {
                            filteredTxCount = response.totalCount;
                        }
                    } else {
                        // Fallback for old format (just array of transactions)
                        transactions = response;
                    }
                }

                // Update cache and state
                update(state => {
                    const updatedCache = new Map(state.cache);
                    const blockCache = updatedCache.get(cacheKey) || { header: blockHeader, pages: new Map(), spacesPages: new Map() };
                    if (onlyWithSpaces) {
                        blockCache.spacesPages.set(pageKey, transactions);
                    } else {
                        blockCache.pages.set(pageKey, transactions);
                    }
                    updatedCache.set(cacheKey, blockCache);

                    return {
                        ...state,
                        currentHeight: height,
                        header: blockHeader,
                        transactions,
                        txCount: blockHeader.tx_count,
                        filteredTxCount,
                        onlyWithSpaces,
                        pagination: {
                            ...state.pagination,
                            currentPage: page,
                            offset
                        },
                        cache: updatedCache
                    };
                });
            } catch (error) {
                update(state => ({
                    ...state,
                    error: error.message
                }));
                throw error;
            }
        },

        clearBlock() {
            set(initialState);
        }
    };
}

export const blockStore = createBlockStore();
export const totalPages = derived(
    blockStore,
    $blockStore => {
        const count = $blockStore.onlyWithSpaces ? $blockStore.filteredTxCount : $blockStore.txCount;
        return Math.ceil(count / $blockStore.pagination.limit);
    }
);
