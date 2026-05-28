import type { PageLoad } from './$types';
import { ROUTES } from '$lib/routes';

export const load: PageLoad = async ({ fetch, params }) => {
    const name = params.name.toLowerCase();
    const [spaceHistoryResponse, statsResponse, spaceCommitmentsResponse, sptrDelegationsResponse] = await Promise.all([
        fetch(ROUTES.api.space.history(name)),
        fetch(ROUTES.api.space.stats(name)),
        fetch(ROUTES.api.space.commitments(name)),
        fetch(ROUTES.api.space.sptrDelegations(name)),
    ]);

    if (!spaceHistoryResponse.ok) {
        throw new Error(`Failed to fetch space history: ${spaceHistoryResponse.statusText}`);
    }
    if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`);
    }

    if (!spaceCommitmentsResponse.ok) {
        throw new Error(`Failed to fetch commitments: ${spaceCommitmentsResponse.statusText}`);
    }

    if (!sptrDelegationsResponse.ok) {
        throw new Error(`Failed to fetch SPTR delegations: ${sptrDelegationsResponse.statusText}`);
    }

    const spaceHistory = await spaceHistoryResponse.json();
    const stats = await statsResponse.json();
    const commitments = await spaceCommitmentsResponse.json();
    const sptrDelegations = await sptrDelegationsResponse.json();

    return {
        items: spaceHistory.items,
        latest: spaceHistory.latest,
        pagination: spaceHistory.pagination,
        currentHeight: spaceHistory.currentHeight,
        stats,
        latestCommitment: commitments.items[0] || null,
        sptrDelegations: sptrDelegations.delegations || []
    };
};
