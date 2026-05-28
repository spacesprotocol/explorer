import db from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async function ({ url }) {
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    // Get total count (vmetaouts + commitments)
    const countResult = await db.execute(sql`
        SELECT
            (SELECT COUNT(*) FROM vmetaouts v JOIN blocks b ON v.block_hash = b.hash WHERE b.height >= 0 AND v.name IS NOT NULL) +
            (SELECT COUNT(*) FROM commitments c JOIN blocks b ON c.block_hash = b.hash WHERE b.orphan = false) as total
    `);

    const total = Number(countResult.rows[0].total);

    // Get paginated results (vmetaouts + commitments)
    const queryResult = await db.execute(sql`
        WITH all_events AS (
            SELECT
                v.action::text as action,
                v.name,
                encode(v.txid, 'hex') as txid,
                b.height,
                b.time,
                v.total_burned,
                NULL as revocation,
                'vmetaout' as event_type,
                t.index as tx_index
            FROM vmetaouts v
            JOIN blocks b ON v.block_hash = b.hash
            JOIN transactions t ON t.txid = v.txid AND t.block_hash = v.block_hash
            WHERE b.height >= 0 AND v.name IS NOT NULL

            UNION ALL

            SELECT
                CASE WHEN c.revocation THEN 'COMMITMENT REVOCATION' ELSE 'COMMITMENT' END as action,
                c.name,
                encode(c.txid, 'hex') as txid,
                b.height,
                b.time,
                NULL as total_burned,
                c.revocation,
                'commitment' as event_type,
                t.index as tx_index
            FROM commitments c
            JOIN blocks b ON c.block_hash = b.hash
            JOIN transactions t ON t.txid = c.txid AND t.block_hash = c.block_hash
            WHERE b.orphan = false
        )
        SELECT *
        FROM all_events
        ORDER BY height DESC, tx_index DESC, CASE WHEN revocation THEN 1 ELSE 0 END ASC
        LIMIT ${limit}
        OFFSET ${offset}
    `);

    return json({
        items: queryResult.rows,
        pagination: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            itemsPerPage: limit
        }
    });
};
