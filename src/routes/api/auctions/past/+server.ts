import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getEndedAuctions } from '$lib/utils/query';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const GET: RequestHandler = async function ({ request, url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    let limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT));
    
    if (isNaN(page) || page < 1) {
        throw error(400, 'Invalid page parameter');
    }
    if (isNaN(limit) || limit < 1) {
        throw error(400, 'Invalid limit parameter');
    }
    
    limit = Math.min(limit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const sortBy = (url.searchParams.get('sortBy') || 'bid_count');
    const sortDirection = (url.searchParams.get('direction') || 'desc');
    return json(await getEndedAuctions({ 
        db, 
        ended: false,  // or false for current auctions
        limit, 
        offset,
        sortBy: sortBy as 'height' | 'name' | 'total_burned' | 'bid_count',
        sortDirection: sortDirection as 'asc' | 'desc'
    }));
}

