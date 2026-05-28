import type { Transaction, TransactionVmetaout, SpaceCommitment, SpaceDelegation } from '$lib/types/transaction';

export function createTransaction(row: any): Transaction {
    const transaction: Transaction = {
        txid: row.txid.toString('hex'),
        tx_hash: row.tx_hash.toString('hex'),
        version: row.tx_version,
        size: row.tx_size,
        vsize: row.tx_vsize,
        weight: row.tx_weight,
        index: row.tx_index,
        locktime: row.tx_locktime,
        fee: row.tx_fee,
        input_count: row.input_count || 0,
        output_count: row.output_count || 0,
        total_output_value: row.total_output_value || 0,
        vmetaouts: [],
        commitments: [],
        delegations: []
    };

    // Add block and confirmations only if block data exists
    if (row.block_height != null && row.block_time != null) {
        transaction.block = {
            height: row.block_height,
            time: row.block_time,
            ...(row.block_hash && { hash: row.block_hash.toString('hex') })
        };

        if (typeof row.max_height === 'number') {
            // For mempool transactions (block_height = -1), confirmations should be 0
            if (row.block_height === -1) {
                transaction.confirmations = 0;
            } else {
                transaction.confirmations = row.max_height - row.block_height + 1;
            }
        }
    }

    // Add commitment data if present
    if (row.commitment_name && row.commitment_state_root) {
        transaction.commitment_name = row.commitment_name;
        transaction.commitment_history_hash = row.history_hash;
        transaction.commitment_state_root = row.commitment_state_root;
    }

    return transaction;
}

function createVMetaOutput(row: any): TransactionVmetaout | null {
    if (!row.vmetaout_name) return null;

    return {
        value: row.vmetaout_value,
        name: row.vmetaout_name,
        action: row.vmetaout_action,
        burn_increment: row.vmetaout_burn_increment,
        total_burned: row.vmetaout_total_burned,
        claim_height: row.vmetaout_claim_height,
        expire_height: row.vmetaout_expire_height,
        script_error: row.vmetaout_script_error,
        scriptPubKey: row.vmetaout_scriptpubkey ? row.vmetaout_scriptpubkey.toString('hex') : null,
        reason: row.vmetaout_reason,
        signature: row.vmetaout_signature ? row.vmetaout_signature.toString('hex') : null
    };
}

function createCommitment(row: any): SpaceCommitment | null {
    if (!row.commitment_name) return null;

    return {
        name: row.commitment_name,
        state_root: row.commitment_state_root ? row.commitment_state_root.toString('hex') : null,
        history_hash: row.commitment_history_hash ? row.commitment_history_hash.toString('hex') : null,
        revocation: row.commitment_revocation || false
    };
}

function createDelegation(row: any): SpaceDelegation | null {
    if (!row.delegation_sptr || !row.delegation_name) return null;

    return {
        sptr: row.delegation_sptr,
        name: row.delegation_name,
        vout: row.delegation_vout
    };
}

export function processTransactions(queryResult: any): Transaction[] {
    const txs: Transaction[] = [];
    const transactionMap = new Map<string, Transaction>();
    const vmetaoutMap = new Map<string, boolean>();
    const commitmentMap = new Map<string, boolean>();
    const delegationMap = new Map<string, boolean>();

    for (const row of queryResult.rows) {
        const txid = row.txid.toString('hex');
        let transaction = transactionMap.get(txid);

        if (!transaction) {
            transaction = createTransaction(row);
            transactionMap.set(txid, transaction);
            txs.push(transaction);
        }

        const vmetaoutKey = `${txid}_${row.vmetaout_name}`;  // Using name as unique identifier

        if (row.vmetaout_name && !vmetaoutMap.has(vmetaoutKey)) {
            const vmetaout = createVMetaOutput(row);
            if (vmetaout) {
                transaction.vmetaouts.push(vmetaout);
                vmetaoutMap.set(vmetaoutKey, true);
            }
        }

        const commitmentKey = `${txid}_${row.commitment_name}_${row.commitment_revocation}`;  // Using txid + name + revocation as unique identifier

        if (row.commitment_name && !commitmentMap.has(commitmentKey)) {
            const commitment = createCommitment(row);
            if (commitment) {
                transaction.commitments.push(commitment);
                commitmentMap.set(commitmentKey, true);
            }
        }

        const delegationKey = `${txid}_${row.delegation_sptr}_${row.delegation_name}_${row.delegation_vout}`;  // Using txid + sptr + name + vout as unique identifier

        if (row.delegation_sptr && !delegationMap.has(delegationKey)) {
            const delegation = createDelegation(row);
            if (delegation) {
                transaction.delegations.push(delegation);
                delegationMap.set(delegationKey, true);
            }
        }
    }

    return txs;
}
