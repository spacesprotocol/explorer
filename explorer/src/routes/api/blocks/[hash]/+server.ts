import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { spaces, blocks, spacesHistory } from '$lib/schema';

export const GET: RequestHandler = async function ({ request, url, params }) {
    const blockDb = await db.query.blocks.findFirst({ 
        where: sql`${blocks.hash} = ${params.hash}`,
        with: { transactions: { with: { spaceHistories: true } }}
    });

    return json(blockDb);
};