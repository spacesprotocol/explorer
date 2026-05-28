<script lang="ts">
  import { page } from "$app/stores";
  import { menuLinks } from "$lib/links";
  import { slide } from "svelte/transition";
  import { onMount } from "svelte";

  export let isOpen: boolean;

</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-[499] md:hidden" 
    on:click={() => isOpen = false}
    role="presentation"
  />
  
  <!-- Menu -->
  <div class="fixed top-[57px] left-0 right-0 bg-base-100 z-[500] border-t md:hidden overflow-y-auto max-h-[calc(100vh-57px)]" transition:slide={{ duration: 200 }} role="navigation" >
    <nav class="flex flex-col p-4">
      {#each menuLinks as { href, label, external }}
    <a  
      {href}
      class="btn {$page.url.pathname === href ? 'btn-primary' : 'btn-ghost'} btn-sm my-1 justify-start w-full text-left"
      target={external ? "_blank" : undefined}
      on:click={() => isOpen = false}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {label}
    </a>
{/each}
    </nav>
  </div>
{/if}

<style>
  :global(body.mobile-menu-open) {
    overflow: hidden;
  }
</style>
