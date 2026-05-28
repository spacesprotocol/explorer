import db from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { addressToScriptPubKey } from '$lib/utils/address-parsers';
import { env } from '$env/dynamic/public';

// Helper to get mempool.space API URL
function getMempoolApiUrl(path: string): string {
    const isTestnet = env.PUBLIC_BTC_NETWORK && env.PUBLIC_BTC_NETWORK !== 'mainnet';
    const network = isTestnet ? `${env.PUBLIC_BTC_NETWORK}/` : '';
    return `https://mempool.space/${network}api/${path}`;
}

function getMempoolUrl(path: string): string {
    const isTestnet = env.PUBLIC_BTC_NETWORK && env.PUBLIC_BTC_NETWORK !== 'mainnet';
    const network = isTestnet ? `${env.PUBLIC_BTC_NETWORK}/` : '';
    return `https://mempool.space/${network}${path}`;
}

export const GET: RequestHandler = async function ({ url }) {
    const search = url.searchParams.get('q');
    if (!search)
        return json([]);
    const result = [];
    const hashRegexp = /^[a-fA-F0-9]{64}$/;
    const heightRegexp = /^\d+$/;
    const sptrRegexp = /^sptr[a-zA-Z0-9]{59}$/;
    let foundLocally = false;

    // Try to parse as address first
    // try {
    //     const scriptPubKey = Buffer.from(addressToScriptPubKey(search), 'hex');
    //     
    //     const addressTx = await db.execute(sql`
    //         SELECT 1 FROM tx_outputs 
    //         WHERE scriptPubKey = ${scriptPubKey} 
    //         LIMIT 1
    //     `);
    //
    //     if (addressTx.rows[0]) {
    //         result.push({
    //             type: "address",
    //             value: {
    //                 address: search
    //             }
    //         });
    //     }
    // } catch (e) {
    //     // Not a valid address, continue with other searches
    // }

    // Check if it's a space pointer (sptr)
    if (sptrRegexp.test(search)) {
        const sptrResult = await db.execute(sql`
            SELECT
                sp.sptr,
                encode(sp.txid, 'hex') as txid,
                sp.vout,
                sp.value,
                sp.spent_block_hash IS NOT NULL as is_spent,
                b.height as block_height
            FROM space_pointers sp
            JOIN blocks b ON sp.block_hash = b.hash
            JOIN transactions t ON sp.block_hash = t.block_hash AND sp.txid = t.txid
            WHERE sp.sptr = ${search}
            AND b.orphan = false
            ORDER BY b.height DESC, t.index DESC, sp.vout DESC
            LIMIT 1
        `);

        if (sptrResult.rows[0]) {
            foundLocally = true;
            result.push({
                type: "sptr",
                value: sptrResult.rows[0]
            });
        }
    }

    //looks like hash, search for txid or block hash
    if (hashRegexp.test(search)) {
        const hexString = Buffer.from(search, 'hex');

        const transaction = await db.execute(sql`
            SELECT transactions.txid, transactions.block_hash
            FROM transactions
            WHERE txid = ${hexString}
            LIMIT 1
        `);
        if (transaction.rows[0]) {
            foundLocally = true;
            result.push({
                type: "transaction",
                value: {
                    ...transaction.rows[0],
                    txid: transaction.rows[0].txid.toString('hex'),
                    block_hash: transaction.rows[0].block_hash.toString('hex')
                }
            });
        }
        const block = await db.execute(sql`
            SELECT blocks.hash, blocks.height
            FROM blocks
            WHERE hash = ${hexString}
            LIMIT 1
        `);
        if (block.rows[0]) {
            foundLocally = true;
            result.push({
                type: "block",
                value: {
                    ...block.rows[0],
                    hash: block.rows[0].hash.toString('hex'),
                    height: block.rows[0].height
                }
            });
        }

        // If not found locally, check mempool.space
        if (!foundLocally) {
            try {
                // Try as transaction first
                const txResponse = await fetch(getMempoolApiUrl(`tx/${search}`));
                if (txResponse.ok) {
                    result.push({
                        type: "external-transaction",
                        value: {
                            txid: search,
                            url: getMempoolUrl(`tx/${search}`)
                        }
                    });
                } else {
                    // Try as block hash
                    const blockResponse = await fetch(getMempoolApiUrl(`block/${search}`));
                    if (blockResponse.ok) {
                        const blockData = await blockResponse.json();
                        result.push({
                            type: "external-block",
                            value: {
                                hash: search,
                                height: blockData.height,
                                url: getMempoolUrl(`block/${search}`)
                            }
                        });
                    }
                }
            } catch (e) {
                // Ignore errors from external API
            }
        }
    }
    //looks like height
    else if (heightRegexp.test(search)) {
        const height = +search;
        if (height <= 2**32) {
            const block = await db.execute(sql`
                SELECT blocks.hash, blocks.height
                FROM blocks
                WHERE height = ${height}
                LIMIT 1
            `);
            if (block.rows[0]) {
                foundLocally = true;
                result.push({
                    type: "block",
                    value: {
                        ...block.rows[0],
                        hash: block.rows[0].hash.toString('hex'),
                        height: block.rows[0].height
                    }
                });
            }

            // If not found locally, check mempool.space
            if (!foundLocally) {
                try {
                    const blockResponse = await fetch(getMempoolApiUrl(`block-height/${height}`));
                    if (blockResponse.ok) {
                        const blockHash = await blockResponse.text();
                        result.push({
                            type: "external-block",
                            value: {
                                hash: blockHash,
                                height: height,
                                url: getMempoolUrl(`block/${blockHash}`)
                            }
                        });
                    }
                } catch (e) {
                    // Ignore errors from external API
                }
            }
        }
    }

    // the rest should be a space
    const strippedSpace = search.startsWith('@') ? search.substring(1) : search;
    const names = await db.execute(sql`
        WITH matching_spaces AS (
            SELECT DISTINCT
                name,
                similarity(name, ${strippedSpace}) AS similarity_score
            FROM vmetaouts
            WHERE similarity(name, ${strippedSpace}) > 0
            ORDER BY similarity_score DESC, name ASC
            LIMIT 3
        ),
        latest_actions AS (
            SELECT DISTINCT ON (v.name)
                v.name,
                v.action,
                v.claim_height,
                v.expire_height,
                b.height AS block_height
            FROM vmetaouts v
            JOIN blocks b ON v.block_hash = b.hash
            WHERE v.name IN (SELECT name FROM matching_spaces)
                AND b.orphan = false
                AND v.action != 'REJECT'
            ORDER BY v.name, b.height DESC
        ),
        current_height AS (
            SELECT MAX(height) as height FROM blocks
        )
        SELECT
            ms.name,
            ms.similarity_score,
            la.action,
            la.claim_height,
            la.expire_height,
            la.block_height,
            ch.height as current_height
        FROM matching_spaces ms
        LEFT JOIN latest_actions la ON ms.name = la.name
        CROSS JOIN current_height ch
        ORDER BY ms.similarity_score DESC, ms.name ASC
    `);
    for (const space of names.rows) {
        result.push({ type: "space", value: space });
    }
    
    return json(result);
}
