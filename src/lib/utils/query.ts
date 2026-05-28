import { sql } from 'drizzle-orm';

interface BlockTxsQueryParams {
    db: DB;
    blockIdentifier: {
        type: 'hash' | 'height';
        value: string | number | Buffer;
    };
    pagination: {
        limit: number;
        offset: number;
        spaces_limit: number;
        spaces_offset: number;
    };
    onlyWithSpaces?: boolean;
}


export async function getBlockTransactions({ db, blockIdentifier, pagination, onlyWithSpaces = false }: BlockTxsQueryParams) {
    const blockCondition = blockIdentifier.type === 'hash' ? sql`blocks.hash = ${blockIdentifier.value}` : sql`blocks.height = ${blockIdentifier.value}`;
    const blockValue = blockIdentifier.value;

    // Add filter for transactions with Space actions if requested
    const spacesFilter = onlyWithSpaces
        ? sql`AND (EXISTS (SELECT 1 FROM vmetaouts WHERE vmetaouts.txid = transactions.txid AND vmetaouts.name IS NOT NULL) OR EXISTS (SELECT 1 FROM commitments WHERE commitments.txid = transactions.txid))`
        : sql``;

    // Get count if filtering
    let totalCount: number | null = null;
    if (onlyWithSpaces) {
        const countResult = await db.execute(sql`
            SELECT COUNT(DISTINCT transactions.txid)::integer as count
            FROM transactions
            WHERE transactions.block_hash = (
                SELECT hash FROM blocks WHERE ${blockCondition}
            )
            AND (
                EXISTS (
                    SELECT 1 FROM vmetaouts
                    WHERE vmetaouts.txid = transactions.txid
                    AND vmetaouts.name IS NOT NULL
                )
                OR EXISTS (
                    SELECT 1 FROM commitments
                    WHERE commitments.txid = transactions.txid
                )
            )
        `);
        totalCount = countResult.rows[0]?.count || 0;
    }

    const queryResult = await db.execute(sql`
    WITH limited_transactions AS (
    SELECT
        transactions.txid,
        transactions.block_hash,
        transactions.tx_hash,
        transactions.version,
        transactions.size,
        transactions.index,
        transactions.vsize,
        transactions.weight,
        transactions.locktime,
        transactions.fee,
        transactions.input_count,
        transactions.output_count,
        transactions.total_output_value
    FROM transactions
    WHERE transactions.block_hash = (
        SELECT hash FROM blocks WHERE ${blockCondition}
    )
    ${spacesFilter}
    ORDER BY transactions.index
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}),
    limited_vmetaouts AS (
        select
            vmetaouts.txid as vmetaout_txid,
            vmetaouts.value as vmetaout_value,
            vmetaouts.name as vmetaout_name,
            vmetaouts.action as vmetaout_action,
            vmetaouts.burn_increment as vmetaout_burn_increment,
            vmetaouts.total_burned as vmetaout_total_burned,
            vmetaouts.claim_height as vmetaout_claim_height,
            vmetaouts.expire_height as vmetaout_expire_height,
            vmetaouts.script_error as vmetaout_script_error,
            ROW_NUMBER() OVER (PARTITION BY vmetaouts.txid ORDER BY vmetaouts.name ASC) AS rn
        FROM vmetaouts
        WHERE vmetaouts.txid IN (SELECT txid FROM limited_transactions)
    ),
    limited_commitments AS (
        SELECT
            commitments.txid as commitment_txid,
            commitments.name as commitment_name,
            commitments.state_root as commitment_state_root,
            commitments.revocation as commitment_revocation,
            commitments.history_hash as commitment_history_hash,
            ROW_NUMBER() OVER (PARTITION BY commitments.txid ORDER BY commitments.name ASC) AS rn
        FROM commitments
        WHERE commitments.txid IN (SELECT txid FROM limited_transactions)
    )
    SELECT
        limited_transactions.txid AS txid,
        limited_transactions.tx_hash AS tx_hash,
        limited_transactions.version AS tx_version,
        limited_transactions.size AS tx_size,
        limited_transactions.index AS tx_index,
        limited_transactions.vsize AS tx_vsize,
        limited_transactions.weight AS tx_weight,
        limited_transactions.locktime AS tx_locktime,
        limited_transactions.fee AS tx_fee,
        limited_transactions.input_count,
        limited_transactions.output_count,
        limited_transactions.total_output_value,

        limited_vmetaouts.vmetaout_value,
        limited_vmetaouts.vmetaout_name,
        limited_vmetaouts.vmetaout_action,
        limited_vmetaouts.vmetaout_burn_increment,
        limited_vmetaouts.vmetaout_total_burned,
        limited_vmetaouts.vmetaout_claim_height,
        limited_vmetaouts.vmetaout_expire_height,
        limited_vmetaouts.vmetaout_script_error,

        limited_commitments.commitment_name,
        limited_commitments.commitment_state_root,
        limited_commitments.commitment_history_hash,
        limited_commitments.commitment_revocation

    FROM limited_transactions
    LEFT JOIN limited_vmetaouts ON limited_vmetaouts.vmetaout_txid = limited_transactions.txid AND limited_vmetaouts.rn BETWEEN ${pagination.spaces_offset} AND ${pagination.spaces_offset+pagination.spaces_limit}
    LEFT JOIN limited_commitments ON limited_commitments.commitment_txid = limited_transactions.txid AND limited_commitments.rn BETWEEN ${pagination.spaces_offset} AND ${pagination.spaces_offset+pagination.spaces_limit}
    ORDER BY limited_transactions.index;
    `);
    return { queryResult, totalCount };
}

export async function getAuctions({
    db,
    limit = 20,
    offset = 0,
    sortBy = 'height',
    sortDirection = 'desc'
}) {
    const orderByClause = {
        height: sql`auction_end_height ${sql.raw(sortDirection)}, name ASC`,
        name: sql`name ${sql.raw(sortDirection)}`,
        total_burned: sql`max_total_burned ${sql.raw(sortDirection)}, auction_end_height ASC`,
        value: sql`max_total_burned ${sql.raw(sortDirection)}, auction_end_height ASC`,
        bid_count: sql`bid_count ${sql.raw(sortDirection)}, auction_end_height ASC`
    }[sortBy];

    const queryResult = await db.execute(sql`
 WITH current_rollouts AS (
    -- Get the ROLLOUT with highest claim_height for each name
    SELECT DISTINCT ON (v.name)
        v.*,
        b.height as rollout_height,
        t.index as rollout_tx_index
    FROM vmetaouts v
    JOIN blocks b ON v.block_hash = b.hash
    JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
    WHERE v.action = 'ROLLOUT'
    AND b.orphan = false
    ORDER BY v.name, v.claim_height DESC),
    auction_bids AS (
        -- Get all valid bids for current auctions (including pre-ROLLOUT ones)
        SELECT
            v.*,
            b.height,
            t.index
        FROM vmetaouts v
        JOIN blocks b ON v.block_hash = b.hash
        JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
        JOIN current_rollouts r ON v.name = r.name
        WHERE v.action = 'BID'
        AND b.orphan = false
        AND NOT EXISTS (
            -- No REVOKE after this bid but before/at rollout
            SELECT 1
            FROM vmetaouts rev
            JOIN blocks rb ON rev.block_hash = rb.hash
            JOIN transactions rt ON rt.block_hash = rev.block_hash AND rt.txid = rev.txid
            WHERE rev.name = v.name
            AND rev.action = 'REVOKE'
            AND rb.orphan = false
            AND (
                rb.height > b.height
                OR (rb.height = b.height AND rt.index > t.index)
            )
            AND (
                rb.height < r.rollout_height
                OR (rb.height = r.rollout_height AND rt.index < r.rollout_tx_index)
            )
        )
    ),
    auction_stats AS (
        -- Calculate stats for active auctions
        SELECT
            r.name,
            r.claim_height as rollout_claim_height,
            COUNT(b.*) as bid_count,
            COALESCE(MAX(b.total_burned), r.total_burned) as max_total_burned,
            -- Get the latest claim height from bids or rollout
            COALESCE(MAX(b.claim_height), r.claim_height) as auction_end_height
        FROM current_rollouts r
        LEFT JOIN auction_bids b ON b.name = r.name
        WHERE NOT EXISTS (
            -- Check the auction hasn't been ended by TRANSFER or REVOKE
            SELECT 1
            FROM vmetaouts v
            JOIN blocks b ON v.block_hash = b.hash
            JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
            WHERE v.name = r.name
            AND (v.action = 'TRANSFER' OR v.action = 'REVOKE')
            AND b.orphan = false
            AND (
                b.height > r.rollout_height
                OR (b.height = r.rollout_height AND t.index > r.rollout_tx_index)
            )
        )
        GROUP BY r.name, r.claim_height, r.total_burned
    ),
    full_auction_data AS (
        SELECT
            r.*,
            s.bid_count,
            s.max_total_burned,
            s.auction_end_height,
            COUNT(*) OVER() as total_count
        FROM current_rollouts r
        JOIN auction_stats s ON s.name = r.name
        ORDER BY ${
            sortBy === 'total_burned' ? sql`s.max_total_burned ${sql.raw(sortDirection)}, s.auction_end_height ASC` :
            sortBy === 'bid_count' ? sql`s.bid_count ${sql.raw(sortDirection)}, s.auction_end_height ASC` :
            sql`s.auction_end_height ${sql.raw(sortDirection)}, r.name ASC`
        }
        LIMIT ${limit}
        OFFSET ${offset}
    ),
    latest_actions AS (
        -- Get latest valid bid/rollout for each auction
        SELECT DISTINCT ON (v.name)
            v.*,
            b.height,
            b.time,
            f.total_count,
            f.bid_count,
            f.rollout_height,
            f.max_total_burned,
            f.auction_end_height
        FROM vmetaouts v
        JOIN blocks b ON v.block_hash = b.hash
        JOIN transactions t ON t.block_hash = v.block_hash AND t.txid = v.txid
        JOIN full_auction_data f ON v.name = f.name
        WHERE v.action IN ('BID', 'ROLLOUT')
        AND b.orphan = false
        ORDER BY v.name, b.height DESC, t.index DESC
    )
    SELECT * FROM latest_actions
    ORDER BY ${orderByClause}
    `);

    const totalCount = queryResult.rows[0]?.total_count || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    const processedResult = queryResult.rows.map(row => ({
        ...row,
        block_hash: row.block_hash.toString('hex'),
        txid: row.txid.toString('hex'),
    }));

    return {
        items: processedResult,
        pagination: {
            page,
            limit,
            total_items: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    };
}

export async function getEndedAuctions({ 
    db, 
    limit = 20, 
    offset = 0,
    sortBy = 'height',
    sortDirection = 'desc'
}: AuctionQueryParams): Promise<PaginationResult> {
    const orderByClause = {
        height: sql`height ${sql.raw(sortDirection)}, name ASC`,
        name: sql`name ${sql.raw(sortDirection)}`,
        total_burned: sql`total_burned ${sql.raw(sortDirection)}, height DESC`,
        value: sql`total_burned ${sql.raw(sortDirection)}, height DESC`,
        bid_count: sql`bid_count ${sql.raw(sortDirection)}, height DESC`
    }[sortBy];

    const queryResult = await db.execute(sql`
WITH latest_rollouts AS (
    SELECT DISTINCT ON (vmetaouts.name)
        vmetaouts.*,
        blocks.height as rollout_height FROM vmetaouts
    JOIN blocks ON vmetaouts.block_hash = blocks.hash
    WHERE vmetaouts.action = 'ROLLOUT'
    ORDER BY vmetaouts.name, blocks.height DESC
),
non_ended_with_stats AS (
    SELECT
        lr.*,
        COALESCE(bid_stats.bid_count, 0) as bid_count,
        COALESCE(bid_stats.max_total_burned, lr.total_burned) as max_total_burned,
        COUNT(*) OVER() as total_count
    FROM latest_rollouts lr
    LEFT JOIN (
        SELECT
            vmetaouts.name,
            COUNT(*) as bid_count,
            MAX(vmetaouts.total_burned) as max_total_burned
        FROM vmetaouts
        JOIN blocks ON vmetaouts.block_hash = blocks.hash
        WHERE vmetaouts.action = 'BID'
        GROUP BY vmetaouts.name
    ) bid_stats ON bid_stats.name = lr.name
    WHERE EXISTS (
        SELECT 1
        FROM vmetaouts
        JOIN blocks ON vmetaouts.block_hash = blocks.hash
        WHERE vmetaouts.name = lr.name
        AND (vmetaouts.action = 'TRANSFER' or vmetaouts.action = 'REVOKE')
        AND blocks.height > lr.rollout_height
    )
    ORDER BY ${
        sortBy === 'total_burned' ? sql`max_total_burned ${sql.raw(sortDirection)}, rollout_height DESC` :
        sortBy === 'bid_count' ? sql`bid_count ${sql.raw(sortDirection)}, rollout_height DESC` :
        sql`rollout_height ${sql.raw(sortDirection)}, name ASC`
    }
    LIMIT ${limit}
    OFFSET ${offset}
),
latest_actions AS (
    SELECT DISTINCT ON (vmetaouts.name)
        vmetaouts.*,
        blocks.height,
        blocks.time,
        non_ended_with_stats.total_count,
        non_ended_with_stats.bid_count
    FROM vmetaouts
    JOIN blocks ON vmetaouts.block_hash = blocks.hash
    JOIN non_ended_with_stats ON vmetaouts.name = non_ended_with_stats.name
    WHERE (vmetaouts.action = 'BID' or vmetaouts.action = 'ROLLOUT')
    AND blocks.height >= non_ended_with_stats.rollout_height
    ORDER BY vmetaouts.name, blocks.height DESC
)
SELECT * FROM latest_actions
ORDER BY ${orderByClause}
`);

    const totalCount = queryResult.rows[0]?.total_count || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    const processedResult = queryResult.rows.map(row => ({
        ...row,
        block_hash: row.block_hash.toString('hex'),
        txid: row.txid.toString('hex'),
    }));

    return {
        items: processedResult,
        pagination: {
            page,
            limit,
            total_items: totalCount,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    };
}
