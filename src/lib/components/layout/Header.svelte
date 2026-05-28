<script lang="ts">
  import { env } from "$env/dynamic/public";
  import Logo from "./Logo.svelte";
  import SearchBar from "./SearchBar.svelte";
  import NavigationLinks from "./NavigationLinks.svelte";
  import MobileMenu from "./MobileMenu.svelte";
  let mobileMenuOpen = false;
</script>

{#if env.PUBLIC_BTC_NETWORK === "testnet4"}
  <div class="justify-center bg-red-500 text-white text-center">
    This is testnet4 explorer, all transactions have no value on this chain.
  </div>
{/if}

<div class="layout-header shadow-sm mb-10">
  <div class="layout-header-content max-w-[1280px] w-full mx-auto flex items-center gap-2 md:gap-5 px-4 md:px-8">
    <Logo />
    <SearchBar />
    <NavigationLinks />

    <button
      class="md:hidden ml-auto"
      on:click={() => mobileMenuOpen = !mobileMenuOpen}
    >
      {#if mobileMenuOpen}
        <svg fill="currentColor" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
        </svg>
      {:else}
        <svg fill="currentColor" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
        </svg>
      {/if}
    </button>

    <MobileMenu bind:isOpen={mobileMenuOpen} />
  </div>
</div>

<style>
  .layout-header {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .layout-header-content {
    position: relative;
    display: flex;
  }
</style>
