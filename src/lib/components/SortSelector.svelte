<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { page } from '$app/stores'

  export let options: any[] = [];

  let sort = $page.url.searchParams.get('sort');
  let direction = $page.url.searchParams.get('direction');
  let selected = options.find(x => x.key == sort && (!direction || x.direction == direction)) ?? options[0];

  let open = false;
  let elem: HTMLElement;
  const dispatch = createEventDispatcher();

  onMount(() => {
    const handler = (e: any) => {
      if (!elem.contains(e.target) && open) open = false;
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  });
</script>

<button class="relative w-full" bind:this={elem} on:click={() => (open = !open)}>
  <div class="dark:bg-black border border-primary group w-full p-2 cursor-pointer flex justify-between items-center gap-1 text-sm">
    <div class="grow">{selected.name}</div>
    <svg class="w-[18px] h-[18px] group-hover:fill-gray-300" xmlns="http://www.w3.org/2000/svg" fill="gray" viewBox="0 0 320 512"
      ><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
        d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8L32 224c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8l256 0c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"
      /></svg
    >
  </div>
  <div class="absolute top-[calc(100%+5px)] w-full right-0 z-10 flex-col gap-2 light:bg-primary dark:bg-black border border-primary p-2 text-sm rounded-sm {open ? 'flex' : 'hidden'}">
    {#each options as option}
      <button
        on:click|stopPropagation={() => {
          selected = option;
          open = false;
          dispatch('change', option);
        }}
        class="cursor-pointer text-left {selected == option ? 'bg-gray-800 light:bg-gray-500 light:text-white' : ''} hover:bg-gray-800 light:hover:bg-gray-500 light:hover:text-white text-nowrap p-1">{option.name}</button
      >
    {/each}
  </div>
</button>
