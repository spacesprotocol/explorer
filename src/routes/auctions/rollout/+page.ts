import { error, type ServerLoad } from '@sveltejs/kit';
export const load : ServerLoad  = async ({ fetch, params }) => {
    const page = 1; // Initial page

    const [stats] = await Promise.all([
        fetch('/api/stats').then(x => x.body ? x.json() : null)
    ]);
    return { stats };
    throw error(404, 'Space not found');
};
