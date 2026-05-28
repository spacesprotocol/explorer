<script lang="ts">
    import '$lib/styles/link.css';
    import TruncatableText from '$lib/components/TruncatableText.svelte';
    
    export let address: string;
    export let truncate = false;
</script>

<span class="link-container mono-link" title={truncate ? address : undefined}>
    {#if truncate}
        <TruncatableText text={address}  />
    {:else}
        {address}
    {/if}
</span>

<style>
    .link-container {
        display: inline-flex;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        vertical-align: middle;
    }
</style>
