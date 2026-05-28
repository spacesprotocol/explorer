import db from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async function ({ url }) {
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM rollouts;
    `);

    const total = Number(countResult.rows[0].total);

    const queryResult = await db.execute(sql`
        SELECT *
        FROM rollouts r
        ORDER BY target ASC, bid desc
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
