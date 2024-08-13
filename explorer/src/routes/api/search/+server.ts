import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql, asc, desc } from 'drizzle-orm';
import { spaces, spacesHistory, blockStats } from '$lib/schema';

export const GET: RequestHandler = async function ({ request, url }) {
    const search = url.searchParams.get('q');
    if (!search)
        return json([]);

    const result = await db.select().from(spaces).where(sql`similarity(${spaces.name}, ${search}) > 0`).orderBy(sql`similarity(${spaces.name}, ${search}) desc`).limit(3);

    return json(result);
}