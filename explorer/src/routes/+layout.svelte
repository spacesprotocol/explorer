<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import Spinner from "$lib/components/Spinner.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from '$app/environment'; 
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  let search = "";
  let timeout: any;
  let searching = false;
  let searchResults: any[] = [];
  let showSearchResults = false;
  let navigatingToSpacePage = false;
  let searchBar: any;
  let highlightedResultIdx: number = -1;
  let mobileMenuOpen = false;
  $: {
    if (browser) {
      document.getElementsByTagName('html')[0].style.overflow = mobileMenuOpen ? 'hidden' :  'unset'
    }
  }

  function handleSearch(value: string) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(getResults, 250);
  }

  async function getResults() {
    if (!search.length) return;
    
    searching = true;
    showSearchResults = false;
    highlightedResultIdx = -1;
    searchResults = await fetch("/api/search?q=" + search).then((x) => x.json());
    searching = false;
    if (!navigatingToSpacePage)
      showSearchResults = true;
  }

  function highlightResult(event: any) {
    if (event.key != 'Enter')
      navigatingToSpacePage = false;

    if (event.key == 'ArrowDown' && highlightedResultIdx < searchResults.length - 1)
      highlightedResultIdx = highlightedResultIdx + 1;
    else if (event.key == 'ArrowUp' && highlightedResultIdx > 0)
      highlightedResultIdx = highlightedResultIdx -1;
    else if (event.key == 'Enter') {
      showSearchResults = false;
      if (highlightedResultIdx >= 0) {
        search = searchResults[highlightedResultIdx].name;
        highlightedResultIdx = -1;
        goto(`/space/${search.slice(search[0] == '@' ? 1 : 0)}`);
      } else if (search.length > 0 && search != '@') {
        navigatingToSpacePage = true;
        showSearchResults = false;
        search = search[0] == '@' ? search : `@${search}`;
        goto(`/space/${search[0] == '@' ? search.slice(1) : search}`);
      }
    }
  }

  onMount(() => {
    const handler = (e: any) => {
      if (!searchBar.contains(e.target) && showSearchResults) showSearchResults = false;
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  });
</script>

<div class="shadow-sm mb-10 flex justify-center">
  <div class="container flex p-2 px-2 md:px-10 items-center gap-2 md:gap-5">
    <a href="/" class="flex items-center shrink-0">
      <img class="w-[50px] h-[50px]" src="/logo.png" alt="Spaces Protocol" />
      <h1 class="text-xl font-bold hidden lg:block">Spaces Protocol</h1>
    </a>
    <label bind:this={searchBar} class="h-[40px] grow input input-bordered !outline-none flex items-center gap-2 relative">
      <input on:keydown={highlightResult} on:focus={() => {navigatingToSpacePage = false; showSearchResults = searchResults.length > 0 && search.length > 0}} bind:value={search} on:input={(e) => handleSearch(e.target.value)} type="text" class="grow" placeholder="Search" />
      {#if !navigatingToSpacePage && (searching || showSearchResults)}
        <div class="text-sm text-gray-500 flex flex-col px-4 py-2 gap-1 bg-black light:bg-primary light:text-primary-content border border-primary w-full absolute top-[calc(100%+5px)] left-0">
          {#if searching && !navigatingToSpacePage}
            <div class="flex p-1 py-2 items-center">
              <Spinner size={2.5} />
            </div>
          {:else if showSearchResults && searchResults.length}
            {#each searchResults as result, idx}
              <a class="p-1 hover:bg-gray-800 light:hover:bg-gray-500 light:hover:text-white {highlightedResultIdx == idx ? "bg-gray-800 light:bg-gray-500" : ""}" on:click={() => {showSearchResults = false; search = result.name;}} href={`/space/${result.name.slice(1)}`}>{result.name}</a>
            {/each}
          {:else if showSearchResults}
            No results
          {/if}
        </div>
      {/if} 

      {#if search.length}
        <svg on:click={() => { search = ''; showSearchResults = false; }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="cursor-pointer h-4 w-4 hover:opacity-100 opacity-70"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
      {/if}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 opacity-70">
        <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
      </svg>
    </label>
    <div class="md:flex hidden">
      <a href="/" class="btn {$page.url.pathname == '/' ? 'btn-primary' : 'btn-ghost'} btn-sm">Current Auctions</a>
      <a href="/upcoming" class="btn {$page.url.pathname == '/upcoming' ? 'btn-primary' : 'btn-ghost'} btn-sm">Upcoming</a>
      <a href="/past" class="btn {$page.url.pathname == '/past' ? 'btn-primary' : 'btn-ghost'} btn-sm">Past</a>
      <!-- <a href="/explorer" class="btn {$page.url.pathname == '/explorer' ? 'btn-primary' : 'btn-ghost'} btn-sm">Explorer</a> -->
      <a href="https://spacesprotocol.org" target="_blank" class="btn btn-ghost btn-sm">Help</a>
    </div>
    <button class="md:hidden mr-1 ml-[2px] z-[501]" on:click={() => mobileMenuOpen = !mobileMenuOpen }>
      {#if mobileMenuOpen}
        <svg fill="currentColor" class='w-[25px] h-[25px]'  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
      {:else}
        <svg fill="currentColor" class='w-[25px] h-[25px]' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>
      {/if}
    </button>
    <nav class='fixed top-0 left-0 w-[100vw] h-[100vh] z-[500] flex transition-transform ease-in-out {mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}'>
      <div class='w-[20%] bg-black bg-opacity-30 h-full'></div>
      <ul class='w-[80%] bg-[#b0661d] flex flex-col gap-10 pt-20'>
        <li class='text-center'><a on:click={() => mobileMenuOpen = false} href="/" class="!text-lg btn {$page.url.pathname == '/' ? 'light:bg-primary light:border-primary bg-[#25292e] border-[#25292e]' : 'btn-ghost'} btn-sm">Current Auctions</a></li>
        <li class='text-center'><a on:click={() => mobileMenuOpen = false} href="/upcoming" class="!text-lg btn {$page.url.pathname == '/upcoming' ? 'light:bg-primary light:border-primary bg-[#25292e] border-[#25292e]' : 'btn-ghost'} btn-sm">Upcoming</a></li>
        <li class='text-center'><a on:click={() => mobileMenuOpen = false} href="/past" class="!text-lg btn {$page.url.pathname == '/past' ? 'light:bg-primary light:border-primary bg-[#25292e] border-[#25292e]' : 'btn-ghost'} btn-sm">Past</a></li>
        <!-- <li class='text-center'><a on:click={() => mobileMenuOpen = false} href="/explorer" class="!text-lg btn {$page.url.pathname == '/explorer' ? 'bg-[#25292e] border-[#25292e]' : 'btn-ghost'} btn-sm">Explorer</a></li> -->
        <li class='text-center'><a on:click={() => mobileMenuOpen = false} href="https://spacesprotocol.org" target="_blank" class="!text-lg btn btn-ghost btn-sm">Help</a></li>
        <li class="mt-20 !text-lg">
          <ThemeToggle showName={true} />
        </li>
      </ul>
    </nav>
    <div class="hidden md:block">
      <ThemeToggle />
    </div>
  </div>
</div>
<div class="container mx-auto pb-10">
  <slot />
</div>
