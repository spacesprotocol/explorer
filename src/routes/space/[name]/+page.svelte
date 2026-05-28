<script lang="ts">
    import { formatDuration, formatBTC, displayUnicodeSpace, getActionColor, normalizeSpace } from "$lib/utils/formatters";
    import dayjs from "dayjs";
    import LocalizedFormat from "dayjs/plugin/localizedFormat";
    import { page } from '$app/stores';
    import TransactionLink from '$lib/components/Transaction/TransactionLink.svelte';
    import SpaceTimeline from '$lib/components/Spaces/SpaceTimeline.svelte';
    import BlockLink from '$lib/components/Block/BlockLink.svelte';
    import Pagination from '$lib/components/Pagination.svelte';
    import TruncatableText from '$lib/components/TruncatableText.svelte';
    import CopyButton from '$lib/components/CopyButton.svelte';
    import type { Vmetaout } from '$lib/types/space';
    import { ROUTES } from '$lib/routes';
    import { env }  from '$env/dynamic/public';

    dayjs.extend(LocalizedFormat);

    export let data;

    const MARKETPLACE_URI = env.MARKETPLACE_URI || 'https://spaces.market';
    const rawSpaceName = normalizeSpace($page.params.name);
    const marketplaceUrl = `${MARKETPLACE_URI}/space/${rawSpaceName}`;

    let vmetaouts: Vmetaout[] = [];
    let latestVmetaout: Vmetaout | null = null;
    let pagination;
    let currentPage = 1;
    let spaceName: string;
    let currentBlockHeight: number;
    let expiryHeight: number | undefined;
    let status: string;
    let numberOfBids: number;
    let highestBid: number;
    let bidsPresent: boolean;
    let outpointTxid: string | null = null;
    let outpointIndex: number | null = null;
    let isListedInMarketplace: boolean = false;
    let latestCommitment: string | null = null;
    let sptrDelegations: any[] = [];

    $: {
        if (data) {
            vmetaouts = data.items;
            latestVmetaout = data.latest;
            pagination = data.pagination;
            spaceName = displayUnicodeSpace(latestVmetaout?.name);
            currentBlockHeight = data.currentHeight;
            expiryHeight = latestVmetaout?.expire_height;
            numberOfBids = data.stats.number_of_bids;

            outpointTxid = data.stats.outpoint_txid || null;
            outpointIndex = data.stats.outpoint_index !== undefined ? Number(data.stats.outpoint_index) : null;

            isListedInMarketplace = data.stats.is_listed_in_marketplace || false;

            latestCommitment = data.latestCommitment || null;

            sptrDelegations = data.sptrDelegations || [];

            bidsPresent = data.items.filter(item => item.burn_increment !== null).length > 0;

            status = computeSpaceStatus(latestVmetaout, currentBlockHeight);
            highestBid = data.stats.highest_bid
            }

    }

    function computeSpaceStatus(vmetaout: Vmetaout | null, currentHeight: number): string {
        if (!vmetaout) return 'Open';

        const status = vmetaout.action;
        const claimHeight = vmetaout.claim_height;

        if (status === 'REVOKE') return 'Open';
        if (status === 'RESERVE' || (status === 'BID' && !claimHeight)) return 'Pre-auction';
        if ((status === 'BID' || status === 'ROLLOUT') && claimHeight) {
            if (currentHeight < claimHeight) return 'In Auction';
            return 'Awaiting Claim';
        }
        if (status === 'TRANSFER') return 'Registered';
        if (status === 'REJECT') return 'Not opened';
        return 'Unknown';
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'Open': return 'text-blue-500';
            case 'Pre-auction': return 'text-yellow-500';
            case 'In Auction': return 'text-green-500';
            case 'Awaiting Claim': return 'text-orange-500';
            case 'Registered': return 'text-purple-500';
            default: return 'text-gray-500';
        }
    }

    async function handlePageChange(event: CustomEvent<number>) {
        const page = event.detail;
        const response = await fetch(ROUTES.api.space.history(spaceName, page));

        if (response.ok) {
            const historyData = await response.json();

            // Update only the paginated data, keep stats the same
            data = {
                ...data,
                items: historyData.items,
                pagination: historyData.pagination
            };

            currentPage = page;
            document.querySelector('.history-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    }
</script>

{#if !data.stats.total_actions || data.stats.total_actions == 0}
    <div class="container">
        <h1 class="page-title">{$page.params.name}</h1>
        <div class="page-subtitle">
            {#if ['example', 'test', 'local'].includes(rawSpaceName)}
                <p>This name is reserved and not available for purchase.</p>
            {:else}
                <p>This name is available.</p>
                <p>You can open an auction for it, <a class="page-link" href="https://spacesprotocol.org/" target="_blank">learn more here.</a></p>
            {/if}
        </div>
    </div>
{:else}
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1 class="title">{spaceName}</h1>
                <div class="status-badge {getStatusColor(status)}">
                    <span class="status-indicator"></span>
                    <span class="status-text">{status}</span>
                </div>
            </div>
            
            {#if isListedInMarketplace}
                <div class="header-right">
                    <a 
                        class="marketplace-link"
                        href={marketplaceUrl}
                        title="view on marketplace"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        view on marketplace
                    </a>
                </div>
            {/if}
        </div>

        <div class="details">
            {#if highestBid && highestBid !=0}
                <div class="detail-item">
                    <span class="detail-value">{formatBTC(highestBid)}</span>
                    <span class="detail-label">Highest bid</span>
                </div>
            {/if}
            {#if numberOfBids > 0}
                <div class="detail-item">
                    <span class="detail-value">{numberOfBids}</span>
                    <span class="detail-label">Number of bids</span>
                </div>
            {/if}
            <div class="detail-item">
                <span class="detail-value">{data.stats.total_actions}</span>
                <span class="detail-label">Total events</span>
            </div>
            {#if data.stats.claim_height}
                <div class="detail-item">
                    <span class="detail-value">
                        {#if data.stats.claim_height <= currentBlockHeight }
                            <BlockLink height={data.stats.claim_height} inline={true} />
                        {:else }
                            Block {data.stats.claim_height}
                        {/if}
                    </span>
                    <span class="detail-label">Claim height</span>
                </div>
            {/if}
            {#if expiryHeight}
                <div class="detail-item">
                    <span class="detail-value">
                        {#if expiryHeight <= currentBlockHeight}
                            <BlockLink height={expiryHeight} inline={true}/>
                        {:else}
                            <div class="future-block-info">
                                <span class="future-block">Block #{expiryHeight}</span>
                                <span class="time-remaining text-xs text-muted">in {formatDuration((expiryHeight - currentBlockHeight) * 10 * 60)}</span>
                            </div>
                        {/if}
                    </span>
                    <span class="detail-label">Expires at</span>
                </div>
            {/if}
            {#if outpointTxid}
                <div class="detail-item">
                    <span class="detail-value outpoint-value">
                        <TransactionLink txid={outpointTxid} truncate={true} outputIndex={outpointIndex} maxLength={14} />
                    </span>
                    <span class="detail-label">Outpoint</span>
                </div>
            {/if}
            <div class="detail-item">
                {#if latestCommitment && !latestCommitment.revocation}
                    <span class="detail-value commitment-value">
                        <div class="commitment-display">
                            <TruncatableText text={latestCommitment.state_root} maxLength={14} />
                            <CopyButton value={latestCommitment.state_root} size={14} />
                        </div>
                    </span>
                {:else}
                    Empty
                {/if}
                <span class="detail-label">State Root</span>
            </div>
            <div class="detail-item">
                {#if latestCommitment }
                    <span class="detail-value commitment-value">
                        <div class="commitment-display">
                            <TruncatableText text={latestCommitment.history_hash} maxLength={14} />
                            <CopyButton value={latestCommitment.history_hash} size={14} />
                        </div>
                    </span>
                {:else}
                    Empty
                {/if}
                <span class="detail-label">History Hash</span>
            </div>
        {#if sptrDelegations.length > 0}
            <!-- <div class="details"> -->
                {#each sptrDelegations as delegation}
                    <div class="detail-item">
                        <span class="detail-value">
                            <a href="/sptr/{delegation.sptr}" class="page-link">
                                <TruncatableText text={delegation.sptr} maxLength={16} />
                            </a>
                        </span>
                        <span class="detail-label">Delegation SPTR</span>
                    </div>
                {/each}
            <!-- </div> -->
        {/if}



        </div>

        <div class="space-content">
            <div class="main-content-layout">
                <div class="timeline-section">
                    <h2 class="section-title">Space Timeline</h2>
                    <SpaceTimeline
                        vmetaout={latestVmetaout}
                        currentBlockHeight={currentBlockHeight}
                        />
                </div>

                <div class="history-section">
                    <h2 class="section-title">Transaction History</h2>
                    <div class="history-container">
                        <div class="table-wrapper">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th class="table-header">Event</th>
                                        <th class="table-header">Transaction</th>
                                        {#if bidsPresent > 0}
                                            <th class="table-header text-right">Bid Amount</th>
                                        {/if}
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each vmetaouts as vmetaout}
                                        <tr class="table-row" class:mempool={vmetaout.block_height === -1}>
                                            <td class="table-cell">
                                                <div class="action-cell">
                                                    <div class="action-type {getActionColor(vmetaout.action)}">
                                                        {vmetaout.action}
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="table-cell transaction-cell">
                                                <div class="transaction-info">
                                                    <div class="flex items-center gap-2">
                                                        <TransactionLink txid={vmetaout.txid} truncate={true} />
                                                    </div>
                                                    <div class="tx-details">
                                                        <BlockLink height={vmetaout.block_height} />
                                                        {#if vmetaout.block_height !== -1}
                                                            <div class="time-detail">
                                                                {dayjs.unix(vmetaout.block_time).format('MMM DD HH:mm')}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                </div>

                                                {#if vmetaout.script_error || vmetaout.reason || vmetaout.state_root}
                                                    <div class="error-container">
                                                        {#if vmetaout.script_error}
                                                            <div class="script-error">
                                                                Script Error: {vmetaout.script_error}
                                                            </div>
                                                        {/if}
                                                        {#if vmetaout.reason}
                                                            <div class="revoke-reason">
                                                                Reason: {vmetaout.reason}
                                                            </div>
                                                        {/if}
                                                        {#if vmetaout.state_root}
                                                            <div class="state-root-info" class:revoked={vmetaout.revocation}>
                                                                <span class="state-root-label">State Root:</span>
                                                                <TruncatableText text={vmetaout.state_root} maxLength={40} />
                                                                <CopyButton value={vmetaout.state_root} size={14} />
                                                            </div>
                                                        {/if}
                                                        {#if vmetaout.history_hash && !vmetaout.revocation}
                                                            <div class="state-root-info" >
                                                                <span class="state-root-label">History Hash</span>
                                                                <TruncatableText text={vmetaout.history_hash}
                                                                    maxLength={40} />
                                                                <CopyButton value={vmetaout.history_hash} size={14} />
                                                            </div>
                                                        {/if}

                                                    </div>
                                                {/if}
                                            </td>

                                            {#if bidsPresent }
                                                <td class="table-cell text-right bid-amount">
                                                    {#if vmetaout.action === 'BID'}
                                                        {formatBTC(vmetaout.total_burned)}
                                                    {/if}
                                                </td>
                                            {/if}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>

                        {#if pagination && pagination.totalPages > 1}
                            <div class="pagination-container">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={pagination.totalPages}
                                    on:pageChange={handlePageChange}
                                    />
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @import '$lib/styles/headers.css';
    @import '$lib/styles/common.css';

    .container {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        color: var(--font-size-primary);
        transition: var(--transition-colors);
        max-width: 100%;
        overflow-x: hidden;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        gap: var(--space-4);
    }

    .header-left {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        align-items: center;
        flex: 1;
    }

    .header-right {
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .title {
        font-weight: 700;
        font-size: var(--font-size-3xl);
        color: var(--font-size-primary);
    }

    .details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-3) var(--space-4);
        margin-bottom: var(--space-8);
        width: 100%;
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
        min-height: 1.2em;
    }

    .detail-label {
        color: var(--font-size-muted);
        transition: var(--transition-colors);
        font-size: var(--font-size-lg);
        font-weight: 500;
        line-height: 1.5;
    }

    .future-block-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .status-badge {
        display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
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

.main-content-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-8);
    align-items: start;
}

.timeline-section {
    position: sticky;
    top: var(--space-8);
}

.section-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-bottom: var(--space-6);
}

.history-container {
    background: var(--bg-secondary);
    padding: var(--space-6);
    border-radius: var(--border-radius-lg);
    border: var(--border-width-1) solid var(--border-color);
    max-width: 100%;
    overflow: hidden;
}

.table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.history-table {
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.table-header {
    padding: var(--space-4);
    text-align: left;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--font-size-muted);
    border-bottom: var(--border-width-1) solid var(--border-color);
}

.table-header:nth-child(1) {
    width: 100px;
}

.table-header:nth-child(2) {
    width: auto;
}

.table-header:nth-child(3) {
    width: 140px;
}

.table-row {
    border-bottom: var(--border-width-1) solid var(--border-color);
    transition: var(--transition-colors);
}

.table-row:hover {
    background: var(--bg-hover);
}

.table-cell {
    padding: var(--space-4);
    font-size: var(--font-size-sm);
}

.action-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.transaction-cell {
    max-width: 0;
    width: 100%;
}

.transaction-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    word-break: break-word;
    min-width: 0;
}

.tx-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--font-size-muted);
}

.text-right {
    text-align: right;
}

.bid-amount {
    white-space: nowrap;
    min-width: 120px;
    padding-left: var(--space-2);
    text-align: right;
}

.pagination-container {
    margin-top: var(--space-6);
}

.mempool {
    background-color: var(--bg-warning-50);
}

.mempool:hover {
    background-color: var(--bg-warning-100) !important;
}

.mempool-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    background-color: var(--bg-warning);
    color: var(--font-size-warning);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xs);
    font-weight: 500;
    margin-left: var(--space-2);
}

.error-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-top: var(--space-2);
    word-break: break-word;
}

.error-row {
    background-color: var(--bg-error-50);
}

.error-cell {
    border-bottom: none;
}

.script-error, .revoke-reason {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    background-color: var(--bg-error-50);
    padding: var(--space-2);
    border-radius: var(--border-radius-md);
}

.script-error {
    font-family: var(--font-mono);
}

.state-root-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    padding: var(--space-2);
    background-color: rgb(219 234 254);
    color: rgb(30 58 138);
    border-radius: var(--border-radius-md);
    font-family: var(--font-mono);
}

.state-root-info.revoked {
    text-decoration: line-through;
    opacity: 0.6;
    background-color: rgb(254 226 226);
    color: rgb(185 28 28);
}

.state-root-label {
    font-weight: 600;
    white-space: nowrap;
}

/* Utility classes */
.flex {
    display: flex;
}

.items-baseline {
    align-items: baseline;
}

.items-center {
    align-items: center;
}

.gap-2 {
    gap: var(--space-2);
}

.text-xs {
    font-size: var(--font-size-xs);
}

.text-sm {
    font-size: var(--font-size-sm);
}

.text-muted {
    color: var(--font-size-muted);
}

.future-block {
    color: var(--font-size-muted);
    font-family: var(--font-mono);
}

/* Media Queries */
@media (max-width: 1023px) {
    .main-content-layout {
        grid-template-columns: 1fr;
    }

    .timeline-section {
        position: static;
        margin-bottom: var(--space-8);
    }
}

@media (max-width: 768px) {
    .container {
        padding: var(--space-2);
    }

    .header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
    }

    .header-left {
        justify-content: space-between;
        width: 100%;
    }

    .header-right {
        width: 100%;
        justify-content: center;
    }

    .details {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--space-4);
    }

    .detail-item {
        min-width: 120px;
    }

    .detail-value {
        font-size: var(--font-size-lg);
        word-break: break-word;
    }

    .detail-label {
        font-size: var(--font-size-base);
        white-space: nowrap;
    }

    .future-block-info {
        width: 100%;
    }

    .history-container {
        padding: var(--space-2);
    }

    .table-cell {
        padding: var(--space-2);
    }

    .table-header:nth-child(1) {
        width: 80px;
    }

    .table-header:nth-child(3) {
        width: 100px;
    }

    .transaction-cell {
        min-width: 180px;
        word-break: break-all;
    }

    .tx-details {
        flex-wrap: wrap;
        gap: var(--space-1);
    }

    .bid-amount {
        font-size: var(--font-size-xs);
        min-width: 90px;
    }

    .title {
        font-size: var(--font-size-2xl);
    }

    .status-badge {
        padding: var(--space-1) var(--space-2);
    }
}


.marketplace-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    color: var(--color-link);
    text-decoration: underline;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: var(--border-radius-md);
    line-height: 1;
    height: fit-content;
}

.marketplace-link:hover {
    color: var(--color-link-hover);
}

.marketplace-link:visited {
    color: var(--color-link);
}

.marketplace-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.commitment-display {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

.revoked-commitment {
    text-decoration: line-through;
    opacity: 0.6;
}
</style>
