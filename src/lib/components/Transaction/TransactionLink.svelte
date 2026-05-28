<script lang="ts">
    import '$lib/styles/link.css';
    import TruncatableText from '$lib/components/TruncatableText.svelte';

    export let txid: string;
    export let truncate = false;
    export let outputIndex: number | null = null;
    export let maxLength: number | undefined = undefined;

    $: href = outputIndex !== null ? `/tx/${txid}#output-${outputIndex}` : `/tx/${txid}`;
</script>

<span class="link-container mono-link">
    <a {href} class="tx-link" title={txid}>
        {#if truncate}
            <TruncatableText text={txid} {maxLength} />
        {:else}
            {txid}
        {/if}
    </a>
</span>

<style>
    .link-container {
        display: block;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tx-link {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
