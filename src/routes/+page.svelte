<script lang="ts">
    import SpaceCard from "$lib/components/Spaces/SpaceCard.svelte";
    import RecentActions from "$lib/components/RecentActions.svelte";
    import Rollout from '$lib/components/Rollout.svelte';
    import EmptyState from '$lib/components/layout/EmptyState.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { navigating } from '$app/stores';
    import { ROUTES } from '$lib/routes';
    import '$lib/styles/mainpage.css';
    
    export let data;
    let currentBlockHeight = data.stats.latest_block_height;
</script>

<div class="page-container">
    <div class="content-section stats-section">
        <Stats />
    </div>
    
    <div class="content-section auctions-section">
        <div class="auctions-header">
            <a href="/auctions/current" class="section-title-link">
                <h1 class="section-title">In auction</h1>
            </a>
        </div>
        <div class="auctions-grid">
    {#if $navigating}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Loading spaces...</span>
        </div>
    {:else if data.spaces?.items?.length === 0}
        <EmptyState message="No auctions found" />
    {:else if data.spaces?.items}
        {#each data.spaces.items.slice(0,9) as space (space.name)}
            <div class="card-wrapper">
                <SpaceCard {space} {currentBlockHeight} active=true/>
            </div>
        {/each}
    {:else}
        <EmptyState message="Error loading auctions" />
    {/if}
</div>
    </div>

    <div class="content-sections-wrapper">
        <div class="content-section actions-section">
    <div class="header-container">
        <a href="/actions/mempool" class="section-title-link">
            <h1 class="section-title">Unconfirmed</h1>
        </a>
        <Tooltip text="Some spaces events may be missing or shown incorrectly in mempool." position="right" />
    </div>
    <RecentActions title={false} apiEndpoint={ROUTES.api.auctions.mempool}/>
</div>


        <div class="content-section actions-section">
            <a href="/actions/recent" class="section-title-link">
                <h1 class="section-title">Recent events</h1>
            </a>
            <RecentActions title={false} />
        </div>

        <div class="content-section rollout-section">
            <Rollout currentHeight={currentBlockHeight} itemsPerPage={10} />
        </div>
    </div>
</div>

<style>
.page-container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.content-section {
    width: 100%;
}

.content-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
}

.stats-section {
    margin-bottom: var(--space-2);
}

.rollout-section,
.actions-section,
.auctions-section {
    position: relative;
    padding: var(--space-4) 0;
    min-height: auto;
    height: auto;
}

.auctions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-8);
    gap: var(--space-4);
}

.section-title-link {
    text-decoration: underline;
    color: var(--font-size-primary);
    transition: color 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.section-title-link:hover {
    color: var(--color-primary);
}

.section-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--font-size-primary);
    margin: 0;  /* Remove default margin to ensure proper alignment */
}

.auctions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
    gap: var(--space-6);
    align-items: start;
}

.card-wrapper {
    min-height: 220px;
    width: 100%;
}

.loading-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8);
    color: var(--font-size-muted);
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.header-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

@media (max-width: 640px) {
    .page-container {
        padding: var(--space-3);
        gap: var(--space-6);
    }

    .content-sections-wrapper {
        gap: var(--space-6);
    }

    .auctions-header {
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: var(--space-6);
    }

    .auctions-grid {
        gap: var(--space-4);
        grid-template-columns: 1fr;
    }

    .section-title {
        font-size: var(--font-size-2xl);
    }

    .rollout-section,
    .actions-section,
    .auctions-section {
        padding: var(--space-4) 0;
    }
}
</style>
