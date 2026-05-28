<script lang="ts">
    import dayjs from 'dayjs';
    import CopyButton from '$lib/components/CopyButton.svelte';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
    dayjs.extend(LocalizedFormat);
    export let blockHeader;
</script>

<div class="container">
    <div class="header">
        <h1 class="title">Block</h1>
        <span class="hash">{blockHeader.hash}</span>
        <CopyButton value={blockHeader.hash} />
    </div>

    <!-- Primary Info -->
    <div class="primary-info">
        <div class="primary-item">
            {#if blockHeader.height == -2}
                <span class="primary-value">Orphan</span>
            {:else if blockHeader.height == -1}
                <span class="primary-value">Mempool</span>
            {:else}
                <span class="primary-value">{blockHeader.height}</span>
            {/if}
            <span class="primary-label">Height</span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{blockHeader.confirmations >= 0 ? blockHeader.confirmations : 'N/A'}</span>
            <span class="primary-label">
                <span class="label-full">Confirmations</span>
                <span class="label-short">Confirms</span>
            </span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{dayjs.unix(blockHeader.time).format('MMM D, HH:mm')}</span>
            <span class="primary-label">Time</span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{blockHeader.tx_count}</span>
            <span class="primary-label">
                <span class="label-full">Transactions</span>
                <span class="label-short">TXs</span>
            </span>
        </div>
        <div class="primary-item">
            <span class="primary-value">{blockHeader.vmetaout_count}</span>
            <span class="primary-label">
                <span class="label-full">Spaces Events</span>
                <span class="label-short">Spaces</span>
            </span>
        </div>
    </div>

    <!-- Secondary Info -->
    <div class="details">
        <div class="detail-item">
            <span class="detail-value">{blockHeader.difficulty}</span>
            <span class="detail-label">Difficulty</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{blockHeader.bits}</span>
            <span class="detail-label">Bits</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{blockHeader.nonce}</span>
            <span class="detail-label">Nonce</span>
        </div>
        <div class="detail-item">
            <div class="detail-value-with-copy">
                <span class="detail-value">{blockHeader.hash_merkle_root.slice(0, 4)}...{blockHeader.hash_merkle_root.slice(-4)}</span>
                <CopyButton value={blockHeader.hash_merkle_root} />
            </div>
            <span class="detail-label">
                <span class="label-full">Merkle Root</span>
                <span class="label-short">Merkle</span>
            </span>
        </div>
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

.primary-value {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    font-weight: 550;
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
    padding: var(--space-2) var(--space-6);
    border-right: var(--border-width-1) solid var(--border-color);
    transition: var(--transition-colors);
}

.details > *:last-child {
    border-right: none;
}

.details > *:hover {
    background: var(--bg-primary);
}

.detail-value-with-copy {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: nowrap;
}

.detail-value-with-copy .detail-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 768px) {
    .primary-info {
        grid-template-columns: repeat(2, 1fr);
    }

    /* Last item (Spaces Events) spans full width */
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

    .details > *:nth-child(2n) {
        border-right: none;
    }

    .details > *:nth-child(n+3) {
        border-top: var(--border-width-1) solid var(--border-color);
    }
}

@media (max-width: 640px) {
    .primary-value {
        font-size: var(--font-size-xl);
    }
}
</style>
