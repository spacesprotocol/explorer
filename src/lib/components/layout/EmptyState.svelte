<script lang="ts">
    export let message = "No items found";
</script>

<div class="empty-state">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
    </svg>
    <p>{message}</p>
</div>

<style>
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-16);
        color: var(--font-size-muted);
        gap: var(--space-4);
        text-align: center;
        /* These ensure it centers in grid containers */
        grid-column: 1 / -1;
        width: 100%;
        height: 100%;
        min-height: 300px; /* Adjust based on your needs */
    }

    .empty-state svg {
        stroke: var(--font-size-muted);
        opacity: 0.5;
    }

    .empty-state p {
        font-size: var(--font-size-lg);
    }
</style>
