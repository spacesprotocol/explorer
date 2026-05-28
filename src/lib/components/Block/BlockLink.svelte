<script lang="ts">
  export let height: number;
  export let inline = false; // Add prop to control display
  const href = height === -1 ? '/mempool' : `/block/${height}`;
</script>

<a {href} class="block-link" class:inline>
  <span class="block-text" class:inline>{height === -1 ? 'Mempool' : `Block #${height}`}</span>
</a>

<style>
.block-link {
    color: var(--color-primary);
    text-decoration: none;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-wrap: break-word;
    max-width: 100%;
}

.block-link.inline {
    display: inline;
}

.block-link:hover {
    text-decoration: underline;
}

.block-text {
    display: block;
    white-space: normal;
    line-height: 1.2;
    word-wrap: break-word;
    max-width: 100%;
}

.block-text.inline {
    display: inline;
}
</style>
