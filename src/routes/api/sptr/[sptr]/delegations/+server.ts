import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { SptrDelegation } from '$lib/types/sptr';

export const GET: RequestHandler = async function ({ params, url }) {
    const sptr = params.sptr;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (!sptr) {
        throw error(400, 'SPTR is required');
    }

    // Validate SPTR format (should be 63 characters)
    if (sptr.length !== 63) {
        throw error(400, 'Invalid SPTR format');
    }

    const queryResult = await db.execute(sql`
        SELECT
            sd.identifier,
            sd.sptr,
            sd.name,
            encode(sd.block_hash, 'hex') as block_hash,
            encode(sd.txid, 'hex') as txid,
            sd.vout,
            sd.revoked,
            encode(sd.revoked_block_hash, 'hex') as revoked_block_hash,
            encode(sd.revoked_txid, 'hex') as revoked_txid,
            sd.revoked_vout,
            b.height as block_height,
            b.time as block_time
        FROM sptr_delegations sd
        JOIN blocks b ON sd.block_hash = b.hash
        WHERE sd.sptr = ${sptr}
        AND b.orphan = false
        ORDER BY b.height DESC, sd.identifier DESC
        LIMIT ${limit}
        OFFSET ${offset}
    `);

    const delegations: SptrDelegation[] = queryResult.rows.map(row => ({
        identifier: row.identifier,
        sptr: row.sptr,
        name: row.name,
        block_hash: row.block_hash,
        txid: row.txid,
        vout: row.vout,
        revoked: row.revoked,
        revoked_block_hash: row.revoked_block_hash,
        revoked_txid: row.revoked_txid,
        revoked_vout: row.revoked_vout,
        block: {
            height: row.block_height,
            time: row.block_time
        }
    }));

    return json({
        delegations,
        limit,
        offset
    });
};
