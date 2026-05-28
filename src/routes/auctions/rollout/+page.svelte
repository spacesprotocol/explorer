<script lang="ts">
    import Rollout from "$lib/components/Rollout.svelte";
    export let data;
    let currentBlockHeight = data.stats?.latest_block_height ??  undefined;
</script>

<Rollout currentHeight={currentBlockHeight} withPagination={true} itemsPerPage={10} />
