import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async function ({ params }) {
    const spaceName = params.name;

    if (!spaceName) {
        throw error(400, 'Space name is required');
    }

    const queryResult = await db.execute(sql`
        SELECT
            sd.sptr,
            encode(sd.block_hash, 'hex') as block_hash,
            encode(sd.txid, 'hex') as txid,
            sd.vout,
            b.height as block_height,
            b.time as block_time,
            -- Get the latest space_pointer info for this SPTR
            sp.value,
            sp.spent_block_hash IS NOT NULL as is_spent
        FROM sptr_delegations sd
        JOIN blocks b ON sd.block_hash = b.hash
        LEFT JOIN LATERAL (
            SELECT
                sp2.value,
                sp2.spent_block_hash
            FROM space_pointers sp2
            JOIN blocks b2 ON sp2.block_hash = b2.hash
            JOIN transactions t2 ON sp2.block_hash = t2.block_hash AND sp2.txid = t2.txid
            WHERE sp2.sptr = sd.sptr
            AND b2.orphan = false
            ORDER BY b2.height DESC, t2.index DESC, sp2.vout DESC
            LIMIT 1
        ) sp ON true
        WHERE sd.name = ${spaceName}
        AND sd.revoked = false
        AND b.orphan = false
        ORDER BY b.height DESC
    `);

    const delegations = queryResult.rows.map(row => ({
        sptr: row.sptr,
        block_hash: row.block_hash,
        txid: row.txid,
        vout: row.vout,
        block: {
            height: row.block_height,
            time: row.block_time
        },
        value: row.value ? parseInt(row.value) : null,
        is_spent: row.is_spent
    }));

    return json({ delegations });
};
