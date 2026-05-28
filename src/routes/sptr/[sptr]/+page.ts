import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, params }) => {
    const sptr = params.sptr;

    // Validate SPTR format
    if (!sptr || sptr.length !== 63) {
        throw error(400, 'Invalid SPTR format');
    }

    const [sptrResponse, delegationsResponse] = await Promise.all([
        fetch(`/api/sptr/${sptr}`),
        fetch(`/api/sptr/${sptr}/delegations`)
    ]);

    if (!sptrResponse.ok) {
        if (sptrResponse.status === 404) {
            throw error(404, 'SPTR not found');
        }
        throw error(sptrResponse.status, 'Failed to fetch SPTR details');
    }

    if (!delegationsResponse.ok) {
        throw error(delegationsResponse.status, 'Failed to fetch delegations');
    }

    const sptrDetails = await sptrResponse.json();
    const delegations = await delegationsResponse.json();

    return {
        sptrDetails,
        delegations: delegations.delegations || []
    };
};
