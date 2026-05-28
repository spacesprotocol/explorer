<script lang="ts">
    import dayjs from 'dayjs';
    import Pagination from '$lib/components/Pagination.svelte';
    import TransactionSpaces from '$lib/components/Transaction/TransactionSpaces.svelte';
    import TransactionLink from '$lib/components/Transaction/TransactionLink.svelte';
    import BlockLink from '$lib/components/Block/BlockLink.svelte';
    import ArrowIcon from '$lib/components/Icons/ArrowIcon.svelte';
    import { formatBTC, formatNumberWithSpaces } from '$lib/utils/formatters';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
    dayjs.extend(LocalizedFormat);

    function formatFeeRate(fee: number, vsize: number): string {
        if (vsize === 0) return '0';
        const feeRate = fee / vsize;
        return feeRate.toFixed(2);
    }

    function isCoinbase(transaction: Transaction): boolean {
        return transaction.index === 0;
    }

    interface PaginationInfo {
        currentPage: number;
        totalPages: number;
        offset: number;
        limit: number;
    }

    export let transactions: Transaction[];
    export let pagination: PaginationInfo;
    export let onPageChange: (page: number) => Promise<void>;
    export let onFilterChange: ((showOnlySpaces: boolean) => Promise<void>) | undefined = undefined;
    export let showTransactionTime: boolean = false;
    export let showOnlySpaceActions: boolean = false;

    function handleFilterToggle() {
        if (onFilterChange) {
            onFilterChange(!showOnlySpaceActions);
        }
    }
</script>

<div class="filter-container">
    <label class="filter-label">
        <input
            type="checkbox"
            checked={showOnlySpaceActions}
            on:change={handleFilterToggle}
            class="filter-checkbox"
        />
        <span>Show only transactions with Spaces events</span>
    </label>
</div>

<div class="transactions-container">
    {#each transactions as transaction}
        <div class="transaction-card">
            <div class="transaction-header">
                <div class="transaction-info">
                    <span class="transaction-label">Transaction</span>
                    {#if transaction.index >= 0}
                        <span class="transaction-number">#{transaction.index}</span>
                    {/if}
                    <div class="transaction-link-wrapper">
                        <TransactionLink txid={transaction.txid} truncate={true} />
                    </div>
                </div>
                {#if showTransactionTime}
                    <div class="transaction-time">
                        <BlockLink height={transaction.block.height} />
                        <span class="timestamp">
                            {dayjs.unix(transaction.block.time).format('MMM D, YYYY HH:mm')}
                        </span>
                    </div>
                {/if}
            </div>
            <div class="transaction-aggregates">
                <div class="flow-container">
                    <div class="flow-section">
                        <div class="flow-line">
                            <div class="flow-item">
                                <span class="flow-count">{transaction.input_count}</span>
                                <span class="flow-label">input{transaction.input_count !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="arrow-icon">
                                <ArrowIcon size={48} />
                            </div>
                            <div class="flow-item">
                                <span class="flow-count">{transaction.output_count}</span>
                                <span class="flow-label">output{transaction.output_count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div class="total-value">
                            <span class="total-label">Total:</span>
                            <span class="total-amount">{formatBTC(transaction.total_output_value)}</span>
                        </div>
                        {#if transaction.vmetaouts?.length > 0 || transaction.commitments?.length > 0}
                            {@const eventCount = (transaction.vmetaouts?.length || 0) + (transaction.commitments?.length || 0)}
                            <div class="spaces-indicator">
                                <span class="spaces-count">{eventCount}</span>
                                <span class="spaces-label">Spaces Event{eventCount !== 1 ? 's' : ''}</span>
                            </div>
                        {/if}
                    </div>
                    <div class="metadata-section">
                        <div class="metadata-grid">
                            <div class="metadata-item">
                                <span class="metadata-label">Fee:</span>
                                <span class="metadata-value">
                                    {#if isCoinbase(transaction)}
                                        Coinbase
                                    {:else}
                                        {formatBTC(transaction.fee)}
                                    {/if}
                                </span>
                            </div>
                            {#if !isCoinbase(transaction)}
                                <div class="metadata-item">
                                    <span class="metadata-label">Rate:</span>
                                    <span class="metadata-value">{formatFeeRate(transaction.fee, transaction.vsize)} sat/vB</span>
                                </div>
                            {/if}
                            <div class="metadata-item">
                                <span class="metadata-label">Size:</span>
                                <span class="metadata-value">{formatNumberWithSpaces(transaction.size)} bytes</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">vSize:</span>
                                <span class="metadata-value">{formatNumberWithSpaces(transaction.vsize)} vB</span>
                            </div>
                            <div class="metadata-item">
                                <span class="metadata-label">Weight:</span>
                                <span class="metadata-value">{formatNumberWithSpaces(transaction.weight)} WU</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {#if transaction.vmetaouts?.length > 0 || transaction.commitments?.length > 0 || transaction.delegations?.length > 0}
                <div class="spaces-section">
                    <TransactionSpaces vmetaouts={transaction.vmetaouts || []} commitments={transaction.commitments || []} delegations={transaction.delegations || []} />
                </div>
            {/if}
        </div>
    {/each}
</div>

{#if pagination.totalPages > 1}
    <Pagination 
        currentPage={pagination.currentPage} 
        totalPages={pagination.totalPages} 
        on:pageChange={async (e) => await onPageChange(e.detail)} 
    />
{/if}

<style>
    @import '$lib/styles/variables.css';

    .filter-container {
        padding-left: var(--space-4);
    }

    .filter-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-size-sm);
        color: var(--font-size-primary);
        cursor: pointer;
    }

    .filter-checkbox {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
        accent-color: var(--color-primary);
    }

    .transactions-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-8);
        padding: var(--space-4);
        background: var(--bg-primary);
        border-radius: var(--border-radius-lg);
        transition: var(--transition-colors);
    }

    .transaction-card {
        background: var(--bg-secondary);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--border-radius-xl);
        padding: var(--space-4);
        color: var(--font-size-primary);
        position: relative;
        box-shadow: var(--shadow-sm);
        transition: var(--transition-all);
        min-width: 0; /* Add this to enable truncation */
    }

    .transaction-card:hover {
        transform: translateY(-2px);
        border-color: var(--border-hover);
        box-shadow: var(--shadow-md);
    }

    .transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        min-width: 0; /* Add this to enable truncation */
    }

    .transaction-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        min-width: 0; /* Add this to enable truncation */
    }

    .transaction-label {
        flex-shrink: 0; /* Prevent "Transaction" text from shrinking */
    }

    .transaction-number {
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        white-space: nowrap;
        flex-shrink: 0; /* Prevent number from shrinking */
    }

    .transaction-link-wrapper {
        min-width: 0; /* Enable truncation */
        overflow: hidden; /* Enable truncation */
    }

    .transaction-link-wrapper :global(.link-container) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .transaction-time {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        flex-shrink: 0; /* Prevent time from shrinking */
    }

    .timestamp {
        white-space: nowrap;
    }

    .transaction-aggregates {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: var(--border-width-1) solid var(--border-color);
    }

    .flow-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-6);
    }

    .flow-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        flex: 1;
    }

    .flow-line {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        font-size: var(--font-size-base);
    }

    .flow-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
    }

    .flow-count {
        color: var(--color-primary);
        font-weight: 700;
        font-size: var(--font-size-3xl);
        line-height: 1;
    }

    .flow-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-lg);
    }

    .arrow-icon {
        color: var(--color-primary);
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }

    .arrow-icon :global(svg) {
        filter: drop-shadow(0 2px 4px rgba(255, 120, 0, 0.2));
    }

    .total-value {
        display: flex;
        gap: var(--space-2);
        align-items: baseline;
    }

    .total-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-lg);
    }

    .total-amount {
        color: var(--font-size-primary);
        font-weight: 600;
        font-size: var(--font-size-lg);
    }

    .spaces-indicator {
        display: flex;
        gap: var(--space-2);
        align-items: baseline;
    }

    .spaces-count {
        color: var(--color-primary);
        font-weight: 600;
        font-size: var(--font-size-base);
    }

    .spaces-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
    }

    .metadata-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding-left: var(--space-6);
        border-left: var(--border-width-1) solid var(--border-color);
        flex-shrink: 0;
    }

    .metadata-grid {
        display: grid;
        grid-template-columns: auto auto;
        gap: var(--space-2) var(--space-4);
        align-items: baseline;
    }

    .metadata-item {
        display: contents;
    }

    .metadata-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        text-align: right;
    }

    .metadata-value {
        color: var(--font-size-primary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        white-space: nowrap;
    }

    .spaces-section {
        margin-top: var(--space-6);
    }

    @media (max-width: 640px) {
        .transaction-card {
            padding: var(--space-4);
        }

        .transaction-header {
            flex-direction: column;
            gap: var(--space-2);
            width: 100%;
        }

        .transaction-info {
            width: 100%;
            overflow: hidden;
        }

        .transaction-time {
            align-items: flex-start;
            margin-top: var(--space-2);
            width: 100%;
        }

        .flow-container {
            flex-direction: column;
            gap: var(--space-4);
        }

        .flow-section {
            width: 100%;
        }

        .flow-line {
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--space-3);
        }

        .flow-count {
            font-size: 2rem;
        }

        .arrow-icon :global(svg) {
            width: 40px;
            height: 40px;
        }

        .metadata-section {
            width: 100%;
            align-items: center;
            padding-left: 0;
            padding-top: var(--space-4);
            border-left: none;
            border-top: var(--border-width-1) solid var(--border-color);
        }

        .metadata-grid {
            width: 100%;
            max-width: 400px;
        }
    }
</style>
