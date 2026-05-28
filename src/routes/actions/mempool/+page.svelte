<script lang="ts">
    import { ROUTES } from '$lib/routes';
    import RecentActions from '$lib/components/RecentActions.svelte';
</script>

<RecentActions 
    itemsPerPage={12} 
    showPagination={true} 
    gridView={true} 
    apiEndpoint={ROUTES.api.auctions.mempool}
/>
