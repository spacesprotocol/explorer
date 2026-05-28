<script>
  import { footerLinks } from '$lib/links';
  export let data;
</script>

<footer class="footer">
  <div class="footer-container">
    <nav class="footer-nav">
      {#each footerLinks as { href, text, image }}
        <a {href} target="_blank" rel="noopener noreferrer" class="footer-link" >
          <img src={image} alt={text} class="footer-icon" />
          {text}
        </a>
      {/each}
        {#if data }
          <a class="footer-link" >{data.appVersion}</a>
        {/if}
    </nav>
  </div>
</footer>
<style>

@import '$lib/styles/variables.css';

.footer {
  background-color: var(--bg-secondary);
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
  margin-top: var(--space-8);
  border-top: var(--border-width-1) solid var(--border-color);
  flex-shrink: 0;
}

.footer-container {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.footer-nav {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
}

.footer-link {
  display: flex;
  align-items: center;
  color: var(--color-link);
  text-decoration: underline;
  transition: var(--transition-colors);
}

.footer-link:hover {
  color: var(--color-link-hover);
}

.footer-icon {
  width: 1.5rem;
  height: 1.5rem;
  margin-right: var(--space-2);
  filter: brightness(0);
}
</style>
