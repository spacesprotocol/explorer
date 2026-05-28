<script lang="ts">
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';
    import { ROUTES } from '$lib/routes';
    import TransactionLink from '$lib/components/Transaction/TransactionLink.svelte';
    import { formatBTC, getActionColor, displayUnicodeSpace } from '$lib/utils/formatters';
    import EmptyState from '$lib/components/layout/EmptyState.svelte';
    import Pagination from '$lib/components/Pagination.svelte';
    import BlockLink from '$lib/components/Block/BlockLink.svelte';
    import { fade } from 'svelte/transition';

    export let itemsPerPage = 9;
    export let showPagination = false;
    export let gridView = true;
    export let title = false;
    export let apiEndpoint: string = ROUTES.api.auctions.recent; // Default endpoint
    export let spaceRoute: string = ROUTES.pages.space; // Route for space links


    interface RecentAction {
        action: 'RESERVE' | 'BID' | 'TRANSFER' | 'ROLLOUT' | 'REVOKE' | 'COMMITMENT' | 'COMMITMENT REVOCATION';
        name: string;
        txid: string;
        height: number;
        time: number;
        total_burned?: string;
        reason?: string;
    }

    interface PaginationData {
        total: number;
        page: number;
        totalPages: number;
        itemsPerPage: number;
    }

    let actions: RecentAction[] = [];
    let pagination: PaginationData | null = null;
    let currentPage = 1;
    let isInitialLoading = true;
    let isLoadingData = false;
    let error: string | null = null;


    async function fetchActions(page: number) {
        if (isInitialLoading) {
            isLoadingData = false;
        } else {
            isLoadingData = true;
        }

        error = null;

        try {
            const queryParams = new URLSearchParams({
                limit: itemsPerPage.toString()
            });

            if (showPagination) {
                queryParams.set('page', page.toString());
            }

            const response = await fetch(`${apiEndpoint}?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch recent actions');
            const data = await response.json();

            actions = data.items;
            pagination = data.pagination;
            currentPage = page;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load recent actions';
        } finally {
            isInitialLoading = false;
            isLoadingData = false;
        }
    }

    function handlePageChange(event: CustomEvent<number>) {
        fetchActions(event.detail);
    }

    onMount(() => {
        fetchActions(1);
    });
</script>

<section class="recent-actions">
    {#if title }
        <h2 class="section-title">Recent Spaces Events</h2>
    {/if}
    <div class="content-wrapper">
        <div class="actions-container">
            {#if isInitialLoading}
                <div class={gridView ? "actions-grid" : "actions-list"} transition:fade={{ duration: 200 }}>
                    {#each Array(itemsPerPage) as _}
                        <div class="action-card skeleton-card">
                            <div class="skeleton-text-medium" />
                            <div class="action-meta">
                                <div class="meta-item">
                                    <div class="skeleton-text-short" />
                                    </div>
                                    <div class="meta-item">
                                        <div class="skeleton-text-short" />
                                        </div>
                                        <div class="meta-item">
                                            <div class="skeleton-text-short" />
                                            </div>
                                        </div>
                                    </div>
                    {/each}
                                </div>
            {:else if error}
                <div class="error-card" transition:fade={{ duration: 200 }}>
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">{error}</span>
                </div>
            {:else if actions.length === 0}
                <div transition:fade={{ duration: 200 }}>
                    <EmptyState message="No events found" />
                </div>
            {:else}
                <div class={gridView ? "actions-grid" : "actions-list"} transition:fade={{ duration: 200 }}>
                    {#each actions as action, i (`${action.txid}-${i}`)}
                        <div class="action-card {gridView ? 'grid-card' : 'list-card'}" class:loading-overlay={isLoadingData}>
                            <div class="action-header">
                                <div class="action-main">
                                    <span class="action-type {getActionColor(action.action)}">{action.action}</span>
                                    <a href="{spaceRoute}/{action.name}" class="space-name">{displayUnicodeSpace(action.name)}</a>
                                </div>
                                {#if action.action === 'BID' && action.total_burned}
                                    <div class="bid-value">
                                        {formatBTC(action.total_burned)}
                                    </div>
                                {/if}
                            </div>

                            <div class="action-meta">
                                {#if action.height}
                                    <div class="meta-item block-link">
                                        <BlockLink height={action.height} />
                                    </div>
                                {/if}
                                <div class="meta-item">
                                    <span class="meta-label">Tx</span>
                                    <TransactionLink txid={action.txid} truncate={true}  />
                                </div>
                                {#if action.time}
                                    <div class="meta-item">
                                        <span class="meta-label">Time</span>
                                        <span class="meta-value">
                                            {dayjs.unix(action.time).format('DD MMM HH:mm')}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
                            </div>

                            {#if showPagination && pagination && pagination.totalPages > 1}
                                <div class="pagination-container">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.totalPages}
                                        on:pageChange={handlePageChange}
                                        />
                                </div>
                            {/if}
                            </div>
</section>
<style>
    @import '$lib/styles/common.css';

    /* Base Layout */
    .recent-actions {
        width: 100%;
        padding: var(--space-2);
    }

    .section-title {
        font-size: var(--font-size-2xl);
        font-weight: 600;
        margin-bottom: var(--space-6);
    }

    /* Container and Grid/List Layout */
    .actions-container {
        position: relative;
        min-height: auto;
    }

    .actions-grid, .actions-list {
        position: relative;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
        gap: var(--space-6);
    }

    .actions-list {
        grid-template-columns: 1fr;
    }

    /* Card Styles */
    .action-card {
        display: flex;
        flex-direction: column;
        background: var(--bg-primary-light);
        border: var(--border-width-1) solid var(--color-primary);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        overflow: hidden; /* Prevents content overflow */
    }

    .grid-card {
        height: 160px;
        padding: var(--space-6);
        border-bottom-width: var(--border-width-8);
        border-radius: var(--border-radius-3xl);
    }

    .list-card {
        padding: var(--space-4);
        border-left-width: var(--border-width-8);
        border-radius: var(--border-radius-lg);
    }

    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    /* Card Header */
    .action-header {
        flex: 0 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }

    .action-main {
        display: flex;
        align-items: center;
        gap: var(--space-4);
    }

    .space-name {
        color: var(--font-size-primary);
        text-decoration: none;
        font-size: var(--font-size-base);
        font-weight: 600;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
    }

    .space-name:hover {
        color: var(--color-primary);
    }

    .bid-value {
        font-weight: 600;
        font-size: var(--font-size-xl);
        color: var(--color-primary);
    }

    /* Card Metadata */
    .action-meta {
        margin-top: auto;
        padding-top: var(--space-4);
        border-top: var(--border-width-1) solid var(--border-color);
        display: flex;
        justify-content: space-between;
        gap: var(--space-4);
        flex-wrap: nowrap; /* Prevents wrapping */
        overflow: hidden; /* Ensures metadata stays inside the card */
    }

    .meta-item {
        display: flex;
        flex-direction: column;
        flex-shrink: 0; /* Prevents shrinking */
        min-width: 0; /* Enables text truncation */
        max-width: 100%; /* Prevents the item from exceeding its parent width */
        text-align: left;
    }

    .meta-label {
        font-size: var(--font-size-sm);
        color: var(--font-size-muted);
        white-space: nowrap; /* Prevents label text from wrapping */
    }

    .meta-value {
        font-size: var(--font-size-base);
        font-weight: 500;
        color: var(--font-size-primary);
        white-space: nowrap; /* Prevents wrapping */
        overflow: hidden; /* Hides overflow text */
        text-overflow: ellipsis; /* Adds ellipsis for overflow */
        max-width: 100%; /* Ensures it stays within the parent container */
    }

    /* Block Link */
    .block-link {
        color: var(--color-primary);
        text-decoration: none;
        transition: var(--transition-colors);
        overflow-wrap: break-word; /* Breaks words if necessary */
        word-wrap: break-word; /* Compatibility for older browsers */
        word-break: break-word;
        white-space: normal; /* Allows multi-line display */
    }

    .block-link:hover {
        text-decoration: underline;
    }

    /* Loading States */
    .loading-overlay {
        opacity: 0.5;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }

    .skeleton-card {
        opacity: 0.7;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-text-medium {
        height: 24px;
        width: 60%;
        background: var(--border-color);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-4);
    }

    .skeleton-text-short {
        height: 16px;
        width: 80px;
        background: var(--border-color);
        border-radius: var(--radius-sm);
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.4; }
    }

    /* Error State */
    .error-card {
        padding: var(--space-4);
        background: rgb(254 226 226);
        border-radius: var(--border-radius-lg);
        color: rgb(185 28 28);
        text-align: center;
    }

    .error-icon {
        margin-right: var(--space-2);
    }

    /* Pagination */
    .pagination-container {
        position: relative;
        margin-top: var(--space-8);
        display: flex;
        justify-content: center;
    }

    /* Responsive Adjustments */
    @media (max-width: 640px) {
        .actions-grid {
            grid-template-columns: 1fr;
        }

        .grid-card {
            height: 140px;
            padding: var(--space-4);
        }

        .action-meta {
            gap: var(--space-2);
        }
    }

    .block-link {
        font-size: var(--font-size-base);
        line-height: 1.2;
        max-width: 22%;
        overflow-wrap: anywhere;
    }
</style>
