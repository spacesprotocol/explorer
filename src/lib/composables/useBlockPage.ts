import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { blockStore } from '$lib/stores/blockStore';
import { onDestroy } from 'svelte';

export function useBlockPage() {
    let previousIdentifier: string | null = null;
    let previousPage: number | null = null;
    let previousFilter: boolean | null = null;

    async function loadBlockData(identifier: string, currentPage: number, onlyWithSpaces: boolean) {
        try {
            await blockStore.fetchBlockData(identifier, currentPage, onlyWithSpaces);
            // Update previous values after successful fetch
            previousIdentifier = identifier;
            previousPage = currentPage;
            previousFilter = onlyWithSpaces;
        } catch (error) {
            console.error('Failed to load block data:', error);
        }
    }

    function shouldReload(identifier: string, currentPage: number, onlyWithSpaces: boolean): boolean {
        if (!browser) return false;
        if (!identifier) return false;

        return (
            identifier !== previousIdentifier ||
            currentPage !== previousPage ||
            onlyWithSpaces !== previousFilter
        );
    }

    async function handlePageChange(newPage: number) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', newPage.toString());
        await goto(url.toString(), { keepFocus: true, replaceState: true });
    }

    async function handleFilterChange(showOnlySpaces: boolean) {
        const url = new URL(window.location.href);
        if (showOnlySpaces) {
            url.searchParams.set('filter', 'spaces');
        } else {
            url.searchParams.delete('filter');
        }
        url.searchParams.set('page', '1'); // Reset to first page when filtering
        await goto(url.toString(), { keepFocus: true, replaceState: true });
    }

    // Clear block data when component is destroyed
    onDestroy(() => {
        blockStore.clearBlock();
    });

    return {
        loadBlockData,
        shouldReload,
        handlePageChange,
        handleFilterChange
    };
}
