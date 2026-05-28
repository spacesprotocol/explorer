import db from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { processTransactions } from '$lib/utils/transaction-processor';
import { getBlockTransactions } from '$lib/utils/query';

export const GET: RequestHandler = async function ({ url, params }) {
    let limit = parseInt(url.searchParams.get('limit') || '25');
    if (limit > 50) {
        limit = 50
    }
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const onlyWithSpaces = url.searchParams.get('onlyWithSpaces') === 'true';
    const block_hash = Buffer.from(params.hash, 'hex');

    if (!block_hash) {
        error(404, "No hash provided");
    }
    const { queryResult, totalCount } = await getBlockTransactions({
        db,
        blockIdentifier: { type: 'hash', value: block_hash },
        pagination: {
            limit,
            offset,
            spaces_limit: 10,
            spaces_offset: 0
        },
        onlyWithSpaces
    });

    // If filtering by spaces and we have a totalCount, we know the block exists
    // Return empty array if no transactions match the filter
    if (onlyWithSpaces && totalCount !== null) {
        const txs = processTransactions(queryResult);
        return json({ transactions: txs, totalCount });
    }

    // If not filtering and we get no results, the block doesn't exist
    if (!queryResult.rows || queryResult.rows.length === 0) {
        return error(404, 'Block not found');
    }

    const txs = processTransactions(queryResult);

    return json({ transactions: txs, totalCount });
}
