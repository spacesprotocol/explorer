<script lang="ts">
    import '$lib/styles/link.css';
    export let text: string;
    export let maxLength: number | undefined = undefined;

    $: truncatedText = maxLength && text.length > maxLength
        ? `${text.slice(0, Math.floor(maxLength / 2))}...${text.slice(-Math.floor(maxLength / 2))}`
        : text;
</script>

<span class="truncatable-text mono-link" title={text}>
    {truncatedText}
</span>

<style>
    .truncatable-text {
        display: block;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: monospace;
        font-size: var(--font-size-sm);
    }
</style>
