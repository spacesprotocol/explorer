<script lang="ts">
  import { page } from "$app/stores";
  import { menuLinks } from "$lib/links";
</script>

<div class="md:flex hidden">
  {#each menuLinks as { href, label, external }}
    <a
      {href}
      class="btn {$page.url.pathname === href ? 'btn-primary' : 'btn-ghost'} btn-sm"
      target={external ? "_blank" : undefined}
    >
      {label}
    </a>
  {/each}
</div>
