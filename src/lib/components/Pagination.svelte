<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';

    export let currentPage: number;
    export let totalPages: number;

    
    const dispatch = createEventDispatcher<{ pageChange: number; }>();

    function changePage(page: number) {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            dispatch('pageChange', page);
        }
    }

    function getPageNumbers(current: number, total: number): Array<number | null> {
        const delta = 1; // Number of pages to show on each side of current page
        const pages: Array<number | null> = [];
        
        // Always show first page
        pages.push(1);
        
        if (current > 2 + delta) {
            pages.push(null); // Add ellipsis
        }
        
        // Calculate range around current page
        const rangeStart = Math.max(2, current - delta);
        const rangeEnd = Math.min(total - 1, current + delta);
        
        for (let i = rangeStart; i <= rangeEnd; i++) {
            if (i !== 1 && i !== total) { // Skip if already added first or last page
                pages.push(i);
            }
        }
        
        if (current < total - (1 + delta)) {
            pages.push(null); // Add ellipsis
        }
        
        // Always show last page if there's more than one page
        if (total > 1) {
            pages.push(total);
        }
        
        return pages;
    }

    $: pageNumbers = getPageNumbers(currentPage, totalPages);
</script>

<nav class="pagination" aria-label="Pagination" transition:slide >
    <button class="pagination-button" on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>

    <div class="page-numbers">
        {#each pageNumbers as pageNum}
            {#if pageNum === null}
                <span class="ellipsis" aria-hidden="true">&hellip;</span>
            {:else}
                <button
                    class="page-number"
                    class:active={currentPage === pageNum}
                    on:click={() => changePage(pageNum)}
                    aria-label="Go to page {pageNum}"
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                    {pageNum}
                </button>
            {/if}
        {/each}
    </div>

    <button class="pagination-button" on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
</nav>

<style>
@import '$lib/styles/variables.css';

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-4);
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pagination-button,
.page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: var(--space-2);
  border: var(--border-width-1) solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-secondary);
  color: var(--font-size-primary);
  cursor: pointer;
  transition: var(--transition-colors);
}

.pagination-button:hover:not(:disabled),
.page-number:not(.active):hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-hover);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background-color: var(--color-primary);
  color: white;
  font-weight: 500;
}

.ellipsis {
  color: var(--font-size-muted);
  padding: 0 var(--space-2);
}

@media (max-width: 640px) {
  .page-numbers {
    gap: var(--space-2);
  }
  
  .pagination-button,
  .page-number {
    min-width: 2rem;
    height: 2rem;
    padding: var(--space-2);
  }
}
</style>
