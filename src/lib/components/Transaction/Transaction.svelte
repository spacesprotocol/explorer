<script lang="ts">
    import dayjs from 'dayjs';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
    import TransactionSpaces from '$lib/components/Transaction/TransactionSpaces.svelte';
    import CopyButton from '$lib/components/CopyButton.svelte';
    import TruncatableText from '$lib/components/TruncatableText.svelte';
    import { getMempoolUrl, formatBTC } from '$lib/utils/formatters';
    dayjs.extend(LocalizedFormat);
    $: blockLink = data.block.height >= 0 ?
        `/block/${data.block.height}` :
        data.block.height === -1 ?
        '/mempool'
            : `/block/${data.block.hash}`;

    export let data;
</script>

<div class="container">
    <div class="header">
        <h1 class="title">Transaction</h1>
        <span class="hash">{data.txid}</span>
        <CopyButton value={data.txid} />
    </div>
    <div class="primary-info">
        <div class="primary-item">
            <span class="primary-value">{data.input_count} → {data.output_count}</span>
            <span class="primary-label">
                <span class="label-full">Inputs / Outputs</span>
                <span class="label-short">Ins / Outs</span>
            </span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{(data.vmetaouts?.length || 0) + (data.commitments?.length || 0)}</span>
            <span class="primary-label">
                <span class="label-full">Spaces events</span>
                <span class="label-short">Spaces</span>
            </span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{data.confirmations > 0 ? data.confirmations : 'Unconfirmed'}</span>
            <span class="primary-label">
                <span class="label-full">Confirmations</span>
                <span class="label-short">Confirmations</span>
            </span>
        </div>
        <a href={blockLink} class="primary-item primary-link">
            {#if data.block.height >= 0 }
                <span class="primary-value">{data.block.height}</span>
            {:else if data.block.height == -1 }
                <span class="primary-value">Mempool</span>
            {:else if data.block.height == -2 }
                <span class="primary-value">Orphan block</span>
            {/if}
            <span class="primary-label">Block</span>
        </a>
        <div class="primary-item">
            <span class="primary-value">{formatBTC(data.total_output_value)}</span>
            <span class="primary-label">
                <span class="label-full">Total value</span>
                <span class="label-short">Total</span>
            </span>
        </div>
    </div>

    <!-- Secondary Info -->
    <div class="details">
        <div class="detail-item">
            <span class="detail-value">{formatBTC(data.fee)}</span>
            <span class="detail-label">Fee</span>
        </div>
        {#if data.block.time > 0}
            <div class="detail-item">
                <span class="detail-value">{dayjs.unix(data.block.time).format('MMM D HH:mm')}</span>
                <span class="detail-label">Time</span>
            </div>
        {/if}
        <div class="detail-item">
            <span class="detail-value">{data.weight}</span>
            <span class="detail-label">Weight</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{data.vsize}</span>
            <span class="detail-label">vSize</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{data.size}</span>
            <span class="detail-label">Size</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{data.index >= 0 ? data.index : 'N/A'}</span>
            <span class="detail-label">
                <span class="label-full">Block index</span>
                <span class="label-short">Index</span>
            </span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{data.version}</span>
            <span class="detail-label">Version</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{data.locktime}</span>
            <span class="detail-label">
                <span class="label-full">Lock time</span>
                <span class="label-short">Lock</span>
            </span>
        </div>
    </div>
    {#if data.vmetaouts?.length > 0 || data.commitments?.length > 0 || data.delegations?.length > 0}
        <TransactionSpaces vmetaouts={data.vmetaouts || []} commitments={data.commitments || []} delegations={data.delegations || []} />
    {/if}
    <div class="mempool-link-container">
        <a href={getMempoolUrl(`tx/${data.txid}`)} target="_blank" rel="noopener noreferrer" class="mempool-link">
            View full tx details on mempool.space →
        </a>
    </div>
</div>

<style>
@import '$lib/styles/headers.css';

.primary-info {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    margin-bottom: var(--space-8);
    background: var(--bg-secondary);
    border: var(--border-width-1) solid var(--border-color);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.primary-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: center;
    text-align: center;
    padding: var(--space-6);
    border-right: var(--border-width-1) solid var(--border-color);
    transition: var(--transition-colors);
}

.primary-item:last-child {
    border-right: none;
}

.primary-item:hover {
    background: var(--bg-primary);
}

.primary-link {
    text-decoration: none;
    color: inherit;
}

.primary-link:hover .primary-value {
    color: var(--color-primary-dark);
}

.primary-value {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    font-weight: 700;
    font-family: monospace;
    white-space: nowrap;
}

.primary-label {
    font-size: var(--font-size-lg);
    color: var(--font-size-muted);
    font-weight: 500;
}

.label-short {
    display: none;
}

.details {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-bottom: var(--space-8);
    background: var(--bg-secondary);
    border: var(--border-width-1) solid var(--border-color);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.details > * {
    padding: var(--space-4) var(--space-6);
    border-right: var(--border-width-1) solid var(--border-color);
    border-bottom: var(--border-width-1) solid var(--border-color);
    transition: var(--transition-colors);
}

.details > *:nth-child(4n) {
    border-right: none;
}

.details > *:nth-last-child(-n+4) {
    border-bottom: none;
}

.details > *:hover {
    background: var(--bg-primary);
}

.detail-link {
    text-decoration: none;
    color: inherit;
}

.detail-link:hover .detail-value {
    color: var(--color-primary-dark);
}

.mempool-link-container {
    text-align: center;
}

.mempool-link {
    display: inline-block;
    font-size: 1.5rem;
    color: var(--color-link);
    text-decoration: underline;
    transition: color 0.2s;
}

.mempool-link:hover {
    color: var(--color-link-hover);
}

@media (max-width: 768px) {
    .primary-info {
        grid-template-columns: repeat(2, 1fr);
    }

    /* Last item (Total value) spans full width */
    .primary-item:nth-child(5) {
        grid-column: 1 / -1;
        border-right: none;
        border-top: var(--border-width-1) solid var(--border-color);
    }

    /* Row 1: items 1 and 2 */
    .primary-item:nth-child(1) {
        border-right: var(--border-width-1) solid var(--border-color);
    }

    .primary-item:nth-child(2) {
        border-right: none;
    }

    /* Row 2: items 3 and 4 with top border */
    .primary-item:nth-child(3),
    .primary-item:nth-child(4) {
        border-top: var(--border-width-1) solid var(--border-color);
    }

    .primary-item:nth-child(3) {
        border-right: var(--border-width-1) solid var(--border-color);
    }

    .primary-item:nth-child(4) {
        border-right: none;
    }

    .primary-value {
        font-size: var(--font-size-2xl);
    }

    .label-full {
        display: none;
    }

    .label-short {
        display: inline;
    }

    .details {
        grid-template-columns: repeat(2, 1fr);
    }

    .details > *:nth-child(4n) {
        border-right: var(--border-width-1) solid var(--border-color);
    }

    .details > *:nth-child(2n) {
        border-right: none;
    }

    .details > *:nth-last-child(-n+4) {
        border-bottom: var(--border-width-1) solid var(--border-color);
    }

    .details > *:nth-last-child(-n+2) {
        border-bottom: none;
    }
}

@media (max-width: 640px) {
    .primary-value {
        font-size: var(--font-size-xl);
    }
}

.commitments-section {
    width: 100%;
    background: var(--bg-secondary);
    border: var(--border-width-1) solid var(--border-color);
    border-radius: var(--border-radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-8);
}

.commitments-section .section-title {
    font-size: var(--font-size-xl);
    padding: var(--space-4) var(--space-6);
    margin: 0;
    border-bottom: var(--border-width-1) solid var(--border-color);
    background: var(--bg-secondary);
}

.commitments-section .section-content {
    padding: var(--space-4) var(--space-6);
}

.commitment-item {
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    padding: var(--space-4);
    border: var(--border-width-1) solid var(--border-color);
    transition: var(--transition-all);
}

.commitment-item:hover {
    transform: translateY(-2px);
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
}

.commitment-header {
    margin-bottom: var(--space-3);
}

.commitment-header .space-name {
    font-weight: 700;
    font-size: var(--font-size-xl);
    text-decoration: none;
}

.commitment-header .space-name:hover {
    text-decoration: underline;
}

.commitment-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.commitment-details .detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.commitment-details .detail-label {
    color: var(--font-size-muted);
    font-size: var(--font-size-lg);
}

.state-root-value {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: monospace;
    font-size: var(--font-size-base);
    word-break: break-all;
}
</style>
