import { type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch, url }) => {

    const searchParams = new URLSearchParams(url.search);

    searchParams.set('status', 'auction');
    
    if (!searchParams.get('sort'))
        searchParams.set('sort', 'ending');

    const [spaces, stats] = await Promise.all([
        fetch(`/api/auctions/current`).then(x => x.body ?  x.json() : null),
        fetch('/api/stats').then(x => x.body ? x.json() : null)
    ]);
    return { spaces, stats };
};
