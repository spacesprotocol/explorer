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
			c.name,
			encode(c.block_hash, 'hex') as block_hash,
			encode(c.txid, 'hex') as txid,
			encode(c.state_root, 'hex') as state_root,
			encode(c.history_hash, 'hex') as history_hash,
			c.revocation,
			b.height as block_height,
			t.index as tx_index
		FROM commitments c
		JOIN blocks b ON c.block_hash = b.hash
		JOIN transactions t ON t.block_hash = c.block_hash AND t.txid = c.txid
		WHERE c.name = ${spaceName}
		AND b.orphan = false
		ORDER BY b.height DESC, t.index DESC, c.revocation ASC
		LIMIT 1
	`);

	if (queryResult.rows.length === 0) {
		throw error(404, 'No commitment found for this space');
	}

	// Return null if the commitment has been revoked
	if (queryResult.rows[0].revocation) {
		return json(null);
	}

	return json(queryResult.rows[0]);
};
