import db from '$lib/db';
import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async function () {
    try {
        const queryResult = await db.execute(sql`
            SELECT 
                spaces_root,
                pointers_root,
                hash,
                height
            FROM blocks
            WHERE spaces_root IS NOT NULL
            ORDER BY height DESC LIMIT 120;
        `);
        
        if (!queryResult.rows || queryResult.rows.length === 0) {
            return json([]);
        }

        const formattedAnchors = queryResult.rows.map(row => ({
            spaces_root: row.spaces_root.toString('hex'),
            ptrs_root: row.pointers_root ? row.pointers_root.toString('hex') : null,
            block: {
                hash: row.hash.toString('hex'),
                height: row.height
            }
        }));

        return json(formattedAnchors);
    } catch (error) {
        console.error('Error fetching root anchors:', error);
        return json({ error: 'Failed to fetch root anchors' }, { status: 500 });
    }
};
