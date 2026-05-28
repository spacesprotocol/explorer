<script lang="ts">
    import { page } from '$app/stores';
    import { blockStore, totalPages } from '$lib/stores/blockStore';
    import BlockHeader from '$lib/components/Block/BlockHeader.svelte';
    import BlockTxs from '$lib/components/Block/BlockTxs.svelte';
    import { useBlockPage } from '$lib/composables/useBlockPage';

    // Get params from URL
    $: hash = $page.params.hash;
    $: currentPage = parseInt($page.url.searchParams.get('page') || '1');
    $: onlyWithSpaces = $page.url.searchParams.get('filter') === 'spaces';

    // Use shared block page logic
    const { loadBlockData, shouldReload, handlePageChange, handleFilterChange } = useBlockPage();

    // Handle initial load and subsequent navigation
    $: if (shouldReload(hash, currentPage, onlyWithSpaces)) {
        loadBlockData(hash, currentPage, onlyWithSpaces);
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
        <BlockHeader blockHeader={$blockStore.header} />
    </section>
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
