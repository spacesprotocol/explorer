import db from '$lib/db';
import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async function ({ request, url }) {
    const queryResult = await db.execute(sql`
WITH latest_block AS (
    SELECT height, time
    FROM blocks
    WHERE NOT orphan
    ORDER BY height DESC
    LIMIT 1
),
vmetaouts_stats AS (
    SELECT
        v.name,
        v.action,
        v.total_burned,
        v.script_error
    FROM vmetaouts v
    INNER JOIN blocks b ON b.hash = v.block_hash
    WHERE NOT b.orphan
),
commitments_stats AS (
    SELECT COUNT(*) as total_commitments
    FROM commitments c
    INNER JOIN blocks b ON b.hash = c.block_hash
    WHERE NOT b.orphan
),
name_burns AS (
    SELECT
        name,
        MAX(total_burned) as name_total_burned
    FROM vmetaouts_stats
    WHERE script_error IS NULL
        AND name IS NOT NULL
    GROUP BY name
)
SELECT
    lb.height as latest_block_height,
    lb.time as latest_block_time,
    COUNT(DISTINCT CASE WHEN vs.name IS NOT NULL THEN vs.name END) as unique_names_count,
    (COUNT(*) + (SELECT total_commitments FROM commitments_stats)) as valid_vmetaouts_count,
    (SELECT SUM(name_total_burned) FROM name_burns) as total_burned_sum,
    COUNT(*) FILTER (WHERE vs.name IS NOT NULL AND vs.action = 'RESERVE') as reserve_count,
    COUNT(*) FILTER (WHERE vs.name IS NOT NULL AND vs.action = 'BID') as bid_count,
    COUNT(*) FILTER (WHERE vs.name IS NOT NULL AND vs.action = 'TRANSFER') as transfer_count,
    COUNT(*) FILTER (WHERE vs.name IS NOT NULL AND vs.action = 'ROLLOUT') as rollout_count,
    COUNT(*) FILTER (WHERE vs.name IS NOT NULL AND vs.action = 'REVOKE') as revoke_count
FROM latest_block lb
CROSS JOIN vmetaouts_stats vs
GROUP BY lb.height, lb.time;
    `);

    return json(queryResult.rows[0])
}
