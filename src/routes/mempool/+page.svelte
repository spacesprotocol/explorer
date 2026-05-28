<script lang="ts">
    import { page } from '$app/stores';
    import { blockStore, totalPages } from '$lib/stores/blockStore';
    import BlockTxs from '$lib/components/Block/BlockTxs.svelte';
    import { useBlockPage } from '$lib/composables/useBlockPage';

    const MEMPOOL_HASH = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

    // Get params from URL
    $: currentPage = parseInt($page.url.searchParams.get('page') || '1');
    $: onlyWithSpaces = $page.url.searchParams.get('filter') === 'spaces';

    // Use shared block page logic
    const { loadBlockData, shouldReload, handlePageChange, handleFilterChange } = useBlockPage();

    // Handle initial load and subsequent navigation
    $: if (shouldReload(MEMPOOL_HASH, currentPage, onlyWithSpaces)) {
        loadBlockData(MEMPOOL_HASH, currentPage, onlyWithSpaces);
    }
</script>

{#if $blockStore.error}
    <div class="error">
        Error loading block: {$blockStore.error}
    </div>
{:else if !$blockStore.header}
    <div class="loading">Loading block data...</div>
{:else}
    <section>
        <BlockTxs
            transactions={$blockStore.transactions}
            pagination={{
                currentPage: $blockStore.pagination.currentPage,
                totalPages: $totalPages,
                offset: $blockStore.pagination.offset,
                limit: $blockStore.pagination.limit
            }}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            showOnlySpaceActions={onlyWithSpaces}
        />
    </section>
{/if}

