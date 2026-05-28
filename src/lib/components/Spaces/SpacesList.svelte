<script lang="ts">
    import { onMount } from 'svelte';
    import SpaceCard from '$lib/components/Spaces/SpaceCard.svelte';
    import Pagination from '$lib/components/Pagination.svelte';
    import EmptyState from '$lib/components/layout/EmptyState.svelte';
    import { page } from '$app/stores';
    
    type SortField = 'height' | 'total_burned' | 'bid_count';
    type SortDirection = 'asc' | 'desc';
    
    const SORT_OPTIONS = [
        { label: 'Time left until the end of auction', field: 'height' },
        { label: 'Bid value', field: 'total_burned' },
        { label: 'Number of bids', field: 'bid_count' }
    ] as const;

    export let data: any[] | undefined = undefined;
    export let fetchUrl: string | undefined = undefined;
    export let currentBlockHeight: number;
    export let active: boolean;

    let loading = false;
    let error: string | null = null;
    let spaces: any[] = [];
    let currentPage = 1;
    let totalPages = 0;
    let sortField: SortField = $page.url.searchParams.get('sortBy') as SortField || 'height';
    let sortDirection: SortDirection = $page.url.searchParams.get('direction') as SortDirection || 'asc';
    
    async function fetchSpaces() {
        if (!fetchUrl) {
            if (data) {
                spaces = data;
                return;
            }
            error = 'No data source provided';
            return;
        }

        loading = true;
        error = null;
        
        try {
            const url = new URL(fetchUrl, window.location.origin);
            url.searchParams.set('page', currentPage.toString());
            url.searchParams.set('sortBy', sortField);
            url.searchParams.set('direction', sortDirection);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch spaces');

            const result = await response.json();
            spaces = result.items;
            totalPages = result.pagination.total_pages;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error';
            spaces = [];
        } finally {
            loading = false;
        }
    }

    function handleSortChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        sortField = select.value as SortField;
        currentPage = 1;
        updateUrl();
        fetchSpaces();
    }

    function toggleDirection() {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        updateUrl();
        fetchSpaces();
    }

    function updateUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set('sortBy', sortField);
        url.searchParams.set('direction', sortDirection);
        history.replaceState(null, '', url.toString());
    }

    function handlePageChange(event: CustomEvent<number>) {
        currentPage = event.detail;
        fetchSpaces();
    }

    $: {
        if (data) {
            spaces = data;
        }
    }

    onMount(() => {
        if (fetchUrl) {
            fetchSpaces();
        }
    });
</script>

<div class="spaces-container">
    {#if fetchUrl}
    <div class="controls">
        <div class="sort-controls">
            <select value={sortField} on:change={handleSortChange} >
                {#each SORT_OPTIONS as option}
                    <option value={option.field}>
                        {option.label}
                    </option>
                {/each}
            </select>

            <button on:click={toggleDirection} class="direction-btn" >
                {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
        </div>
    </div>
    {/if}

    {#if loading}
        <div class="loading">Loading...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if spaces.length === 0}
        <EmptyState message="No auctions found" />
    {:else}
        <div class="spaces-grid">
            {#each spaces as space}
                <div class="card-wrapper">
                    <SpaceCard {space} {currentBlockHeight} active={active}/>
                </div>
            {/each}
        </div>

        {#if fetchUrl && totalPages > 1}
            <div class="pagination-wrapper">
                <Pagination currentPage={currentPage} totalPages={totalPages} on:pageChange={handlePageChange} />
            </div>
        {/if}
    {/if}
</div>

<style>
    .spaces-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
    }

    .spaces-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-6); /* Increased gap between cards */
        padding: var(--space-4);
    }

    .card-wrapper {
        min-height: 220px; /* Slightly larger than the card to ensure proper spacing */
        width: 100%;
    }

    .controls {
        display: flex;
        justify-content: flex-end;
        padding: var(--space-4);
    }

    .sort-controls {
        display: flex;
        gap: var(--space-2);
        align-items: center;
    }

    select {
        padding: var(--space-2) var(--space-4);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--border-radius-lg);
        background: var(--bg-secondary);
        color: var(--font-size-primary);
        font-size: var(--font-size-sm);
    }

    .direction-btn {
        padding: var(--space-2) var(--space-4);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--border-radius-lg);
        background: var(--bg-secondary);
        color: var(--font-size-primary);
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .direction-btn:hover {
        background: var(--bg-secondary-hover);
    }

    .pagination-wrapper {
        margin-top: var(--space-6);
    }

    .loading, .error {
        text-align: center;
        padding: var(--space-8);
        color: var(--font-size-muted);
    }

    .error {
        color: var(--color-error);
    }

    @media (max-width: 640px) {
        .spaces-grid {
            grid-template-columns: 1fr;
            padding: var(--space-2);
        }

        .controls {
            padding: var(--space-2);
        }
    }

</style>
