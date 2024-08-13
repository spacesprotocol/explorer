import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { spaces, spacesHistory } from '$lib/schema';

export const GET: RequestHandler = async function ({ request, url, params }) {
    const spaceName = `@${params.name}`;
    const spacesDb = await db.query.spaces.findFirst({
        extras: {
            rank: sql`
                        (select rank from (
                            select name, dense_rank() over(order by bid_amount desc, name_sha256) as rank from spaces
                            where status = 'pre-auction'
                        ) where name = ${spaceName})
                    `.as('rank'),
            top_10_cutoff_bid: sql`
                        (select bid_amount from (
                            select name, bid_amount, dense_rank() over(order by bid_amount desc, name_sha256) as rank from spaces
                            where status = 'pre-auction'
                        ) where rank <= 10 order by rank desc limit 1)
                    `.as('top_10_cutoff_bid')
        },
        orderBy: spaces.id,
        where: sql`${spaces.name} = ${spaceName}`,
        with: {
            history: {
                columns: { id: true, action: true, bid_amount: true, txid: true, createdAt: true, meta: true },
                with: { transaction: { with: { block: { columns: { time: true } } } } },
                orderBy: (history, { desc }) => desc(history.id),
            },
        }
    });

    if (!spacesDb)
        error(404, { error: "Space not found" });

    return json(spacesDb);
};