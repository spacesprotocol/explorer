import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { SptrDetails } from '$lib/types/sptr';

export const GET: RequestHandler = async function ({ params }) {
    const sptr = params.sptr;

    if (!sptr) {
        throw error(400, 'SPTR is required');
    }

    // Validate SPTR format (should be 63 characters)
    if (sptr.length !== 63) {
        throw error(400, 'Invalid SPTR format');
    }

    const queryResult = await db.execute(sql`
        SELECT
            sp.identifier,
            encode(sp.block_hash, 'hex') as block_hash,
            encode(sp.txid, 'hex') as txid,
            sp.vout,
            sp.sptr,
            sp.value,
            encode(sp.script_pubkey, 'hex') as script_pubkey,
            encode(sp.data, 'hex') as data,
            encode(sp.spent_block_hash, 'hex') as spent_block_hash,
            encode(sp.spent_txid, 'hex') as spent_txid,
            sp.spent_vin,
            b.height as block_height,
            b.time as block_time,
            -- Delegation info
            sd.identifier as delegation_identifier,
            sd.name as delegation_name,
            encode(sd.block_hash, 'hex') as delegation_block_hash,
            encode(sd.txid, 'hex') as delegation_txid,
            sd.vout as delegation_vout,
            sd.revoked as delegation_revoked,
            encode(sd.revoked_block_hash, 'hex') as delegation_revoked_block_hash,
            encode(sd.revoked_txid, 'hex') as delegation_revoked_txid,
            sd.revoked_vout as delegation_revoked_vout,
            db.height as delegation_block_height,
            db.time as delegation_block_time
        FROM space_pointers sp
        JOIN blocks b ON sp.block_hash = b.hash
        JOIN transactions t ON sp.block_hash = t.block_hash AND sp.txid = t.txid
        LEFT JOIN sptr_delegations sd ON sd.sptr = sp.sptr
            AND sd.revoked = false
        LEFT JOIN blocks db ON sd.block_hash = db.hash
        WHERE sp.sptr = ${sptr}
        AND b.orphan = false
        ORDER BY b.height DESC, t.index DESC, sp.vout DESC
        LIMIT 1
    `);

    if (queryResult.rows.length === 0) {
        throw error(404, 'SPTR not found');
    }

    const row = queryResult.rows[0];

    const response: SptrDetails = {
        pointer: {
            identifier: row.identifier,
            block_hash: row.block_hash,
            txid: row.txid,
            vout: row.vout,
            sptr: row.sptr,
            value: parseInt(row.value),
            script_pubkey: row.script_pubkey,
            data: row.data,
            spent_block_hash: row.spent_block_hash,
            spent_txid: row.spent_txid,
            spent_vin: row.spent_vin,
            block: {
                height: row.block_height,
                time: row.block_time
            }
        },
        delegation: row.delegation_identifier ? {
            identifier: row.delegation_identifier,
            sptr: row.sptr,
            name: row.delegation_name,
            block_hash: row.delegation_block_hash,
            txid: row.delegation_txid,
            vout: row.delegation_vout,
            revoked: row.delegation_revoked,
            revoked_block_hash: row.delegation_revoked_block_hash,
            revoked_txid: row.delegation_revoked_txid,
            revoked_vout: row.delegation_revoked_vout,
            block: {
                height: row.delegation_block_height,
                time: row.delegation_block_time
            }
        } : null,
        is_spent: row.spent_block_hash !== null,
        is_delegated: row.delegation_identifier !== null
    };

    return json(response);
};
