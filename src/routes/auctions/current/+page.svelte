<script lang="ts">
    import SpacesList from "$lib/components/Spaces/SpacesList.svelte";
    import '$lib/styles/mainpage.css';
    
    export let data;
    let currentBlockHeight = data.stats?.latest_block_height ??  undefined;
    
</script>

<SpacesList fetchUrl="/api/auctions/current" currentBlockHeight={currentBlockHeight} active=true />
