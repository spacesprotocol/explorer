import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { env }  from '$env/dynamic/private';

const MARKETPLACE_URI = env.MARKETPLACE_URI || 'https://spaces.market/';

async function checkMarketplaceListing(spaceName: string): Promise<boolean> {
    try {
        const response = await fetch(`${MARKETPLACE_URI}/api/space/${spaceName}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', },
            signal: AbortSignal.timeout(2500)
        });
        return response.ok;
    } catch (error) {
        // console.warn(`Failed to check marketplace for space ${spaceName}:`, error);
        return false;
    }
}

export const GET: RequestHandler = async function ({ params }) {
    const spaceName = params.name;

    if (!spaceName) {
        throw error(400, 'Space name is required');
    }

    const [queryResult, isListedInMarketplace] = await Promise.all([
        db.execute(sql`
            WITH current_rollout AS (
                -- Get the latest non-revoked ROLLOUT
                SELECT DISTINCT ON (v.name)
                    v.*,
                    b.height as rollout_height,
                    t.index as rollout_tx_index
                FROM vmetaouts v
                JOIN blocks b ON v.block_hash = b.hash
                JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
                WHERE v.action = 'ROLLOUT'
                AND v.name = ${spaceName}
                AND b.orphan = false
                AND NOT EXISTS (
                    -- Check if this ROLLOUT wasn't revoked
                    SELECT 1
                    FROM vmetaouts rev
                    JOIN blocks rb ON rev.block_hash = rb.hash
                    JOIN transactions rt ON rt.block_hash = rev.block_hash AND rt.txid = rev.txid
                    WHERE rev.name = v.name
                    AND rev.action = 'REVOKE'
                    AND rb.orphan = false
                    AND (rb.height > b.height OR (rb.height = b.height AND rt.index > t.index))
                )
                ORDER BY v.name, v.claim_height DESC
            ),
            valid_bids AS (
                -- Get all valid bids for current auction (both pre and post ROLLOUT)
                SELECT
                    b.*,
                    bb.height as bid_height,
                    bt.index as bid_index,
                    CASE
                        WHEN bb.height < r.rollout_height OR
                             (bb.height = r.rollout_height AND bt.index < r.rollout_tx_index)
                        THEN 'pre_rollout'
                        ELSE 'post_rollout'
                    END as bid_timing
                FROM vmetaouts b
                JOIN blocks bb ON b.block_hash = bb.hash
                JOIN transactions bt ON bt.block_hash = b.block_hash AND bt.txid = b.txid
                JOIN current_rollout r ON b.name = r.name
                WHERE b.action = 'BID'
                AND bb.orphan = false
                AND NOT EXISTS (
                    -- No REVOKE after this bid but before/at ROLLOUT
                    SELECT 1
                    FROM vmetaouts rev
                    JOIN blocks rb ON rev.block_hash = rb.hash
                    JOIN transactions rt ON rt.block_hash = rev.block_hash AND rt.txid = rev.txid
                    WHERE rev.name = b.name
                    AND rev.action = 'REVOKE'
                    AND rb.orphan = false
                    AND (
                        rb.height > bb.height OR
                        (rb.height = bb.height AND rt.index > bt.index)
                    )
                    AND (
                        rb.height < r.rollout_height OR
                        (rb.height = r.rollout_height AND rt.index <= r.rollout_tx_index)
                    )
                )
            ),
            historical_stats AS (
                -- Get all historical stats regardless of validity
                SELECT
                    COUNT(*) as total_actions,
                    COUNT(CASE WHEN action = 'BID' THEN 1 END) as total_bids_all_time,
                    MAX(CASE WHEN action = 'BID' THEN total_burned END) as highest_bid_all_time
                FROM vmetaouts v
                JOIN blocks b ON v.block_hash = b.hash
                WHERE v.name = ${spaceName}
                AND b.orphan = false
            ),
            commitment_stats AS (
                -- Get all commitments (both commitments and revocations)
                SELECT
                    COUNT(*) as total_commitments
                FROM commitments c
                JOIN blocks b ON c.block_hash = b.hash
                WHERE c.name = ${spaceName}
                AND b.orphan = false
            ),
            latest_outpoint AS (
                -- Get the latest valid outpoint for this name
                SELECT DISTINCT ON (v.name)
                    v.outpoint_txid as txid,
                    v.outpoint_index as index
                FROM vmetaouts v
                JOIN blocks b ON v.block_hash = b.hash
                JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
                WHERE v.name = ${spaceName}
                AND b.orphan = false
                AND v.outpoint_txid IS NOT NULL
                AND v.outpoint_index IS NOT NULL
                ORDER BY v.name, b.height DESC, t.index DESC
            ),
            auction_status AS (
                -- Calculate current auction stats
                SELECT
                    r.name,
                    r.rollout_height as block_height,
                    r.rollout_tx_index as tx_index,
                    COALESCE(MAX(b.claim_height), r.claim_height) as claim_height,
                    r.total_burned as winning_bid,
                    COUNT(b.*) as total_bids,
                    MAX(b.total_burned) as highest_bid,
                    COUNT(CASE WHEN b.bid_timing = 'pre_rollout' THEN 1 END) as pre_rollout_bids,
                    COUNT(CASE WHEN b.bid_timing = 'post_rollout' THEN 1 END) as post_rollout_bids,
                    NOT EXISTS (
                        -- Check if auction is still active
                        SELECT 1
                        FROM vmetaouts v
                        JOIN blocks b ON v.block_hash = b.hash
                        JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
                        WHERE v.name = r.name
                        AND (v.action = 'TRANSFER' OR v.action = 'REVOKE')
                        AND b.orphan = false
                        AND (
                            b.height > r.rollout_height OR
                            (b.height = r.rollout_height AND t.index > r.rollout_tx_index)
                        )
                    ) as is_active
                FROM current_rollout r
                LEFT JOIN valid_bids b ON true
                GROUP BY r.name, r.rollout_height, r.rollout_tx_index, r.claim_height, r.total_burned
            )
            SELECT
                ${spaceName} as name,
                a.block_height,
                a.tx_index,
                a.claim_height,
                a.winning_bid,
                CASE WHEN a.is_active THEN a.total_bids ELSE 0 END as total_bids,
                CASE WHEN a.is_active THEN a.highest_bid ELSE NULL END as highest_bid,
                CASE WHEN a.is_active THEN a.pre_rollout_bids ELSE 0 END as pre_rollout_bids,
                CASE WHEN a.is_active THEN a.post_rollout_bids ELSE 0 END as post_rollout_bids,
                (h.total_actions + COALESCE(cs.total_commitments, 0)) as total_actions,
                h.total_bids_all_time,
                h.highest_bid_all_time,
                encode(o.txid, 'hex') as outpoint_txid,
                o.index as outpoint_index
            FROM historical_stats h
            LEFT JOIN auction_status a ON true
            LEFT JOIN latest_outpoint o ON true
            LEFT JOIN commitment_stats cs ON true;
        `),
        checkMarketplaceListing(spaceName)
    ]);

    if (queryResult.rows.length === 0) {
        return json({
            name: spaceName,
            block_height: null,
            tx_index: null,
            claim_height: null,
            winning_bid: null,
            total_bids: 0,
            pre_rollout_bids: 0,
            post_rollout_bids: 0,
            total_actions: 0,
            total_bids_all_time: 0,
            highest_bid_all_time: null,
            outpoint_txid: null,
            outpoint_index: null,
            is_listed_in_marketplace: isListedInMarketplace
        });
    }

    return json({
        ...queryResult.rows[0],
        is_listed_in_marketplace: isListedInMarketplace
    });
};
