import db from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

const ITEMS_PER_PAGE = 10;

export const GET: RequestHandler = async function ({ params, url }) {
	let spaceName = params.name.toLowerCase();
	const page = Number(url.searchParams.get('page')) || 1;
	const offset = (page - 1) * ITEMS_PER_PAGE;

	if (spaceName.startsWith('@')) {
		spaceName = spaceName.slice(1);
	}

	const queryResult = await db.execute(sql`
		WITH counts AS (
			SELECT COUNT(*) as total_commitments
			FROM commitments c
			JOIN blocks b ON c.block_hash = b.hash
			WHERE c.name = ${spaceName} AND b.orphan = false
		)
		SELECT
			c.name,
			encode(c.block_hash, 'hex') as block_hash,
			encode(c.txid, 'hex') as txid,
			encode(c.state_root, 'hex') as state_root,
			encode(c.history_hash, 'hex') as history_hash,
			c.revocation,
			b.height as block_height,
			b.time as block_time,
			t.index as tx_index,
			counts.total_commitments
		FROM commitments c
		JOIN blocks b ON c.block_hash = b.hash
		JOIN transactions t ON t.block_hash = c.block_hash AND t.txid = c.txid
		CROSS JOIN counts
		WHERE c.name = ${spaceName}
		AND b.orphan = false
		ORDER BY b.height DESC, t.index DESC, c.revocation ASC
		LIMIT ${ITEMS_PER_PAGE}
		OFFSET ${offset}
	`);

	const total = queryResult.rows[0]?.total_commitments || 0;

	return json({
		items: queryResult.rows,
		pagination: {
			total,
			page,
			totalPages: Math.ceil(total / ITEMS_PER_PAGE),
			itemsPerPage: ITEMS_PER_PAGE
		}
	});
};
