<script lang='ts'>
    import { formatDuration } from "$lib/utils";
    import { onMount } from "svelte";
    export let seconds: number;

    onMount(() => {
        const ival = setInterval(() => { seconds -= 60 }, 60000);
        return () => clearInterval(ival);
    });
    
</script>
<span>{formatDuration(seconds)}</span>
