import db, { pool } from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { processTransactions } from '$lib/utils/transaction-processor';

// In-process cache for max block height — new blocks arrive every ~10min
let _maxHeight: { value: number; expiry: number } | null = null;

async function getMaxHeight(): Promise<number> {
    const now = Date.now();
    if (_maxHeight && now < _maxHeight.expiry) return _maxHeight.value;
    const result = await db.execute(sql`SELECT COALESCE(MAX(height), -1)::integer AS max_height FROM blocks`);
    const value = (result.rows[0]?.max_height as number) ?? -1;
    _maxHeight = { value, expiry: now + 30_000 };
    return value;
}

// Named prepared statement — plan is cached per connection, eliminating ~180ms planning time
const GET_TX_QUERY = {
    name: 'get_transaction_v1',
    text: `
    WITH transaction_data AS (
        SELECT
            transactions.txid,
            transactions.tx_hash,
            transactions.version AS tx_version,
            transactions.index AS tx_index,
            transactions.size AS tx_size,
            transactions.vsize AS tx_vsize,
            transactions.weight AS tx_weight,
            transactions.locktime AS tx_locktime,
            transactions.fee AS tx_fee,
            transactions.input_count,
            transactions.output_count,
            transactions.total_output_value,
            blocks.time AS block_time,
            blocks.height AS block_height,
            blocks.hash AS block_hash,
            blocks.orphan AS block_orphan,
            $2::integer AS max_height
        FROM transactions
        JOIN blocks ON transactions.block_hash = blocks.hash
        WHERE transactions.txid = $1
        ORDER BY block_height DESC
        LIMIT 1
    ),
    tx_vmetaout AS (
        SELECT
            txid,
            value AS vmetaout_value,
            name AS vmetaout_name,
            reason AS vmetaout_reason,
            action AS vmetaout_action,
            burn_increment AS vmetaout_burn_increment,
            total_burned AS vmetaout_total_burned,
            claim_height AS vmetaout_claim_height,
            expire_height AS vmetaout_expire_height,
            script_error AS vmetaout_script_error,
            signature AS vmetaout_signature,
            scriptPubKey AS vmetaout_scriptPubKey
        FROM vmetaouts
        WHERE txid = $1 AND name IS NOT NULL
    ),
    tx_commitments AS (
        SELECT
            txid,
            name AS commitment_name,
            state_root AS commitment_state_root,
            history_hash AS commitment_history_hash,
            revocation AS commitment_revocation
        FROM commitments
        WHERE txid = $1
    ),
    tx_delegations AS (
        SELECT
            txid,
            sptr AS delegation_sptr,
            name AS delegation_name,
            vout AS delegation_vout
        FROM sptr_delegations
        WHERE txid = $1
        UNION ALL
        SELECT
            revoked_txid AS txid,
            sptr AS delegation_sptr,
            name AS delegation_name,
            revoked_vout AS delegation_vout
        FROM sptr_delegations
        WHERE revoked_txid = $1 AND revoked = true
    )
    SELECT
        transaction_data.*,
        tx_vmetaout.vmetaout_value,
        tx_vmetaout.vmetaout_name,
        tx_vmetaout.vmetaout_action,
        tx_vmetaout.vmetaout_burn_increment,
        tx_vmetaout.vmetaout_total_burned,
        tx_vmetaout.vmetaout_claim_height,
        tx_vmetaout.vmetaout_expire_height,
        tx_vmetaout.vmetaout_script_error,
        tx_vmetaout.vmetaout_scriptpubkey,
        tx_vmetaout.vmetaout_signature,
        tx_vmetaout.vmetaout_reason,
        tx_commitments.commitment_name,
        encode(tx_commitments.commitment_state_root, 'hex') AS commitment_state_root,
        encode(tx_commitments.commitment_history_hash, 'hex') AS commitment_history_hash,
        tx_commitments.commitment_revocation,
        tx_delegations.delegation_sptr,
        tx_delegations.delegation_name,
        tx_delegations.delegation_vout
    FROM transaction_data
    LEFT JOIN tx_vmetaout ON transaction_data.txid = tx_vmetaout.txid
    LEFT JOIN tx_commitments ON transaction_data.txid = tx_commitments.txid
    LEFT JOIN tx_delegations ON transaction_data.txid = tx_delegations.txid
    `
};

export const GET: RequestHandler = async function ({ params }) {
    const txid = Buffer.from(params.txid, 'hex');
    const maxHeight = await getMaxHeight();

    const queryResult = await pool.query(GET_TX_QUERY, [txid, maxHeight]);

    if (queryResult.rows.length === 0) {
        return error(404, 'Transaction not found');
    }

    const [transaction] = processTransactions(queryResult);

    return json(transaction);
}
