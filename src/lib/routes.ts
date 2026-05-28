export const ROUTES = {
    // Frontend routes
    pages: {
        home: '/',
        actions: '/actions/recent',
        mempool: '/mempool',
        psbt: '/psbt',
        
        auctions: {
            current: '/auctions/current',
            past: '/auctions/past',
            rollout: '/auctions/rollout'
        },
        
        space: '/space',

        sptr: '/sptr',

        block: '/block',

        transaction: '/tx',

        address: '/address'
    },

    // API routes
    api: {
        actions: {
            rollout: '/api/actions/rollout',
            recent: '/api/actions/recent'
        },
        
        address: (address: string) => `/api/address/${address}`,
        
        auctions: {
            current: '/api/auctions/current',
            mempool: '/api/auctions/mempool',
            past: '/api/auctions/past',
            recent: '/api/auctions/recent'
        },
        
        block: {
            header: {
                byHash: (hash: string) => `/api/block/${hash}/header`,
                byHeight: (height: number | string) => `/api/block/${height}/header`
            },
            transactions: {
                byHash: (hash: string) => `/api/block/${hash}/txs`,
                byHeight: (height: number | string) => `/api/block/${height}/txs`
            }
        },
        
        search: (query: string) => `/api/search?q=${encodeURIComponent(query)}`,
        
        space: {
            history: (name: string, page = 1) => `/api/space/${name}/history?page=${page}`,
            stats: (name: string) => `/api/space/${name}/stats`,
            commitment: (name: string) => `/api/space/${name}/commitment`,
            commitments: (name: string, page = 1) => `/api/space/${name}/commitments?page=${page}`,
            sptrDelegations: (name: string) => `/api/space/${name}/sptr-delegations`
        },

        sptr: {
            details: (sptr: string) => `/api/sptr/${sptr}`,
            delegations: (sptr: string, limit = 50, offset = 0) =>
                `/api/sptr/${sptr}/delegations?limit=${limit}&offset=${offset}`
        },

        stats: '/api/stats',
        
        transactions: (txid: string) => `/api/transactions/${txid}`
    }
} as const;
