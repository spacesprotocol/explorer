import { error, type ServerLoad } from '@sveltejs/kit';
export const load : ServerLoad  = async ({ fetch, params }) => {
    const page = 1; // Initial page

    const [vmetaouts, stats] = await Promise.all([
        fetch(`/api/auctions/past?page=${page}`).then(x => x.body ?  x.json() : null),
        fetch('/api/stats').then(x => x.body ? x.json() : null)
    ]);
    return { vmetaouts, stats };
    throw error(404, 'Space not found');
};
