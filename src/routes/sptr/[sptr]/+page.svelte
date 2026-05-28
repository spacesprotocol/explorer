<script lang="ts">
    import { page } from '$app/stores';
    import TransactionLink from '$lib/components/Transaction/TransactionLink.svelte';
    import BlockLink from '$lib/components/Block/BlockLink.svelte';
    import TruncatableText from '$lib/components/TruncatableText.svelte';
    import CopyButton from '$lib/components/CopyButton.svelte';
    import dayjs from "dayjs";
    import LocalizedFormat from "dayjs/plugin/localizedFormat";
    import type { SptrDetails, SptrDelegation } from '$lib/types/sptr';

    dayjs.extend(LocalizedFormat);

    export let data;

    let sptrDetails: SptrDetails;
    let delegations: SptrDelegation[];

    $: {
        if (data) {
            sptrDetails = data.sptrDetails;
            delegations = data.delegations;
        }
    }

    function getStatusColor(isSpent: boolean): string {
        return isSpent ? 'text-red-500' : 'text-green-500';
    }

    function formatSats(sats: number): string {
        return `${sats.toLocaleString()} sats`;
    }
</script>

<svelte:head>
    <title>Space Pointer {$page.params.sptr} - Spaces Protocol - Explorer</title>
</svelte:head>

<div class="container">
    <div class="header">
        <div class="header-left">
            <h1 class="title">Space Pointer</h1>
            <div class="status-badge {getStatusColor(sptrDetails.is_spent)}">
                <span class="status-indicator"></span>
        {#if sptrDetails.is_spent}
                <span class="status-text">Spent</span>
                {/if}
            </div>
        </div>
    </div>

    <div class="main-details">
        <div class="detail-item">
            <span class="detail-value sptr-value">
                <TruncatableText text={sptrDetails.pointer.sptr} maxLength={24} />
                <CopyButton value={sptrDetails.pointer.sptr} size={14} />
            </span>
            <span class="detail-label">SPTR</span>
        </div>

        {#if sptrDetails.is_delegated && sptrDetails.delegation}
            <div class="detail-item">
                <span class="detail-value">
                    <a href="/space/{sptrDetails.delegation.name}" class="page-link">
                        {sptrDetails.delegation.name}
                    </a>
                </span>
                <span class="detail-label">Delegated to</span>
            </div>
        {/if}
    </div>

    <div class="details">
        <div class="detail-item">
            <span class="detail-value">
                <TransactionLink txid={sptrDetails.pointer.txid} truncate={true} outputIndex={sptrDetails.pointer.vout} maxLength={16} />
            </span>
            <span class="detail-label">Created in</span>
        </div>

        <div class="detail-item">
            <span class="detail-value">
                <BlockLink height={sptrDetails.pointer.block.height} inline={true} />
            </span>
            <span class="detail-label">Block height</span>
        </div>

        <div class="detail-item">
            <span class="detail-value">
                {dayjs.unix(sptrDetails.pointer.block.time).format('MMM DD, YYYY HH:mm')}
            </span>
            <span class="detail-label">Created at</span>
        </div>

        <div class="detail-item">
            <span class="detail-value">{formatSats(sptrDetails.pointer.value)}</span>
            <span class="detail-label">Value</span>
        </div>

        <div class="detail-item">
            <span class="detail-value script-pubkey-value">
                <TruncatableText text={sptrDetails.pointer.script_pubkey} maxLength={24} />
                <CopyButton value={sptrDetails.pointer.script_pubkey} size={14} />
            </span>
            <span class="detail-label">Script PubKey</span>
        </div>

        {#if sptrDetails.is_spent}
            <div class="detail-item">
                <span class="detail-value">
                    <TransactionLink txid={sptrDetails.pointer.spent_txid} truncate={true} maxLength={16} />
                </span>
                <span class="detail-label">Spent in</span>
            </div>
        {/if}
    </div>

    <!-- Data Section (if exists) -->
    {#if sptrDetails.pointer.data}
        <div class="section">
            <h2 class="section-title">Data</h2>
            <div class="section-content">
                <div class="data-display">
                    <code class="data-code">{sptrDetails.pointer.data}</code>
                    <CopyButton value={sptrDetails.pointer.data} size={16} />
                </div>
            </div>
        </div>
    {/if}

    <!-- Delegation History Section -->
    {#if delegations.length > 0}
        <div class="section">
            <h2 class="section-title">Delegation History</h2>
            <div class="section-content">
                <div class="table-wrapper">
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th class="table-header">Space Name</th>
                                <th class="table-header">Status</th>
                                <th class="table-header">Transaction</th>
                                <th class="table-header">Block</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each delegations as delegation}
                                <tr class="table-row">
                                    <td class="table-cell">
                                        <a href="/space/{delegation.name}" class="space-link">
                                            {delegation.name}
                                        </a>
                                    </td>
                                    <td class="table-cell">
                                        <span class="status-badge {delegation.revoked ? 'text-red-500' : 'text-green-500'}">
                                            {delegation.revoked ? 'Revoked' : 'Active'}
                                        </span>
                                    </td>
                                    <td class="table-cell">
                                        <TransactionLink txid={delegation.txid} truncate={true} maxLength={16} />
                                    </td>
                                    <td class="table-cell">
                                        <BlockLink height={delegation.block.height} inline={true} />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    @import '$lib/styles/headers.css';
    @import '$lib/styles/common.css';

    .container {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        padding: var(--space-4);
        max-width: 100%;
        overflow-x: hidden;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }

    .header-left {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        align-items: center;
    }

    .title {
        font-weight: 700;
        font-size: var(--font-size-3xl);
        color: var(--color-primary);
    }

    .main-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-8);
    }

    .main-details .detail-item {
        display: flex;
        flex-direction: column-reverse;
        gap: var(--space-2);
    }

    .main-details .detail-value {
        font-size: var(--font-size-xl);
        font-weight: 700;
    }

    .main-details .detail-label {
        font-size: var(--font-size-base);
        font-weight: 700;
    }

    .details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-4);
    }

    .detail-item {
        display: flex;
        flex-direction: column-reverse;
        gap: var(--space-1);
    }

    .detail-value {
        font-size: var(--font-size-lg);
        color: var(--color-primary);
        font-weight: 600;
        transition: var(--transition-colors);
        line-height: 1.2;
    }

    .detail-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        font-weight: 500;
    }

    .sptr-value, .script-pubkey-value {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-family: var(--font-mono);
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--border-radius-3xl);
        font-size: var(--font-size-sm);
        font-weight: 500;
        background-color: var(--bg-secondary);
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: currentColor;
    }

    .status-text {
        color: currentColor;
    }

    .section {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .section-title {
        font-size: var(--font-size-xl);
        font-weight: 600;
        color: var(--color-primary);
    }

    .section-content {
        background: var(--bg-secondary);
        padding: var(--space-4);
        border-radius: var(--border-radius-lg);
        border: var(--border-width-1) solid var(--border-color);
    }

    .space-link {
        color: var(--color-link);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;
    }

    .space-link:hover {
        color: var(--color-link-hover);
        text-decoration: underline;
    }

    .data-display {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
    }

    .data-code {
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
        color: var(--color-primary);
        word-break: break-all;
        flex: 1;
        padding: var(--space-2);
        background: var(--bg-primary);
        border-radius: var(--border-radius-md);
        border: var(--border-width-1) solid var(--border-color);
    }

    .table-wrapper {
        width: 100%;
        overflow-x: auto;
    }

    .history-table {
        width: 100%;
        border-collapse: collapse;
    }

    .table-header {
        padding: var(--space-3);
        text-align: left;
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--font-size-muted);
        border-bottom: var(--border-width-1) solid var(--border-color);
    }

    .table-row {
        border-bottom: var(--border-width-1) solid var(--border-color);
        transition: background-color 0.2s;
    }

    .table-row:hover {
        background: var(--bg-hover);
    }

    .table-cell {
        padding: var(--space-3);
        font-size: var(--font-size-sm);
    }

    .text-green-500 {
        color: rgb(34 197 94);
    }

    .text-red-500 {
        color: rgb(239 68 68);
    }

    @media (max-width: 768px) {
        .container {
            padding: var(--space-2);
        }

        .main-details {
            grid-template-columns: 1fr;
            gap: var(--space-4);
            margin-bottom: var(--space-6);
        }

        .main-details .detail-value {
            font-size: var(--font-size-xl);
        }

        .details {
            grid-template-columns: 1fr;
            gap: var(--space-3);
        }

        .table-wrapper {
            overflow-x: scroll;
        }
    }
</style>
