<script lang="ts">
    import { onMount } from 'svelte';
    import { calculateTimeRemaining, formatBTC, displayUnicodeSpace } from '$lib/utils/formatters';
    import Pagination from '$lib/components/Pagination.svelte';
    
    export let currentHeight: number;
    export let withPagination = false;
    export let itemsPerPage = 10;
    export let layout: 'horizontal' | 'vertical' = 'horizontal'; // 'horizontal' for 2x5, 'vertical' for 5x2

    let rollouts = [];
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let paginationData: { total: number; totalPages: number; } | null = null;
    
    function calculateReleaseHeight(target: number, currentHeight: number): number {
        let blocksLeft = (144 - (currentHeight % 144) + 1) % 144 + target*144;
        if (blocksLeft == 0) {
            blocksLeft = 144
        }
        return currentHeight + blocksLeft;
    }
    
    async function fetchRollouts(page = 1) {
        loading = true;
        error = null;
        
        try {
            const url = withPagination 
                ? `/api/actions/rollout?page=${page}&limit=${itemsPerPage}` 
                : `/api/actions/rollout?limit=${itemsPerPage}`;
                
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch rollouts');
            const data = await response.json();
            
            rollouts = data.items;

            if (withPagination && data.pagination) {
                paginationData = {
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                };
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load rollouts';
        } finally {
            loading = false;
        }
    }

    async function handlePageChange(event: CustomEvent<number>) {
        const newPage = event.detail;
        currentPage = newPage;
        await fetchRollouts(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onMount(() => {
        fetchRollouts();
    });
</script>

<div class="rollouts-wrapper">
    <a href="/auctions/rollout" class="section-title-link">
        <h2 class="rollouts-title">Upcoming rollouts</h2>
    </a>
    <div class="rollouts-container">
        {#if loading}
            <div class="rollouts-grid" class:vertical={layout === 'vertical'}>
                {#each Array(itemsPerPage) as _}
                    <div class="rollout-card skeleton-card">
                        <div class="skeleton-text-medium"></div>
                        <div class="skeleton-text-short"></div>
                        <div class="skeleton-text-short"></div>
                    </div>
                {/each}
            </div>
        {:else if error}
            <div class="error-card">
                <span class="error-icon">⚠️</span>
                <span class="error-text">{error}</span>
            </div>
        {:else if rollouts.length === 0}
            <div class="empty-card">
                <span class="empty-icon">🎯</span>
                <span class="empty-text">No upcoming rollouts</span>
            </div>
        {:else}
            <div class="rollouts-grid" class:vertical={layout === 'vertical'}>
                {#each rollouts as rollout}
                    {@const releaseHeight = calculateReleaseHeight(rollout.target, currentHeight)}
                    <div class="rollout-card">
                        <a href="/space/{rollout.name}" class="space-name">
                            {displayUnicodeSpace(rollout.name)}
                        </a>
                        <div class="bid-amount">
                            Bid: {formatBTC(rollout.bid)} 
                        </div>
                        <div class="details">
                            <div class="release-info" title="Release block height">
                                Expected block: {releaseHeight}
                            </div>
                        </div>
                        <div class="time-remaining" title="Based on estimated block time">
                            Available in: {calculateTimeRemaining(releaseHeight, currentHeight)}
                        </div>
                    </div>
                {/each}
            </div>

            {#if withPagination && paginationData && paginationData.totalPages > 1}
                <div class="pagination-container">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={paginationData.totalPages} 
                        on:pageChange={handlePageChange} 
                    />
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .rollouts-wrapper {
        width: 100%;
        padding: var(--space-2);
    }

    .section-title-link {
        text-decoration: none;
        color: inherit;
        display: block;
        margin-bottom: var(--space-4);
    }

    .section-title-link:hover .rollouts-title {
        color: var(--color-primary);
    }

    .rollouts-title {
        font-size: var(--font-size-2xl);
        font-weight: 600;
        color: var(--font-size-primary);
        transition: color 0.2s;
    }

    .rollouts-container {
        width: 100%;
        position: relative; /* If needed */
        height: auto;
    }

    .rollouts-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr); /* 2x5 layout by default */
        grid-template-rows: repeat(2, 1fr);
        gap: var(--space-4);
        padding: var(--space-2);
    }

    .rollouts-grid.vertical {
        grid-template-columns: repeat(2, 1fr); /* 5x2 layout */
        grid-template-rows: repeat(5, 1fr);
    }

    .rollout-card {
        background: var(--bg-surface);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .rollout-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .space-name {
        font-weight: 500;
        color: var(--color-primary);
        text-decoration: none;
        font-size: var(--font-size-lg);
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .space-name:hover {
        text-decoration: underline;
    }

    .bid-amount {
        color: var(--font-size-base);
        font-size: var(--font-size-sm);
        font-weight: 500;
        padding: var(--space-1) 0;
    }

    .details {
        display: flex;
        justify-content: space-between;
        gap: var(--space-2);
        margin: var(--space-1) 0;
    }

    .release-info {
        padding: var(--space-1) var(--space-2);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: var(--font-size-muted);
        white-space: nowrap;
    }

    .time-remaining {
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        cursor: help;
        margin-top: auto;
        padding-top: var(--space-1);
    }

    .pagination-container {
        margin-top: var(--space-6);
        display: flex;
        justify-content: center;
    }

    .empty-card,
    .error-card {
        width: 100%;
        padding: var(--space-8);
        text-align: center;
        background: var(--bg-surface);
        border-radius: var(--radius-lg);
        color: var(--font-size-muted);
    }

    .empty-icon,
    .error-icon {
        display: block;
        font-size: var(--font-size-3xl);
        margin-bottom: var(--space-2);
    }

    .empty-text,
    .error-text {
        font-size: var(--font-size-lg);
    }

    .error-card {
        background: rgb(254 226 226);
        color: rgb(185 28 28);
    }

    .skeleton-card {
        opacity: 0.7;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-text-medium {
        height: 20px;
        width: 160px;
        background: var(--border-color);
        border-radius: var(--radius-sm);
    }

    .skeleton-text-short {
        height: 16px;
        width: 120px;
        background: var(--border-color);
        border-radius: var(--radius-sm);
        margin-top: var(--space-2);
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.4; }
    }

    @media (max-width: 1024px) {
        .rollouts-grid,
        .rollouts-grid.vertical {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
        }
    }

    @media (max-width: 640px) {
        .rollouts-grid,
        .rollouts-grid.vertical {
            grid-template-columns: 1fr;
        }

        .details {
            flex-direction: column;
            gap: var(--space-1);
        }

        .release-info {
            width: fit-content;
        }
    }
</style>
