import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { spaces, spacesHistory, transactions } from '$lib/schema';

export const GET: RequestHandler = async function ({ request, url, params }) {
    const transaction = await db.query.transactions.findFirst({
        where: sql`${transactions.txid} = ${params.id}`,
        with: {
            block: {
                columns: { time: true, height: true, confirmations: true },
            },
            spaceHistories: { 
                columns: { spaceName: true, action: true, bid_amount: true, meta: true }
            }
        }
    });

    if (!transaction)
        return error(404, 'Transaction not found');

    return json(transaction);
}