<script lang="ts">
  import "../app.css";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import '$lib/styles/variables.css';
  
  export let data;
</script>

<div class="app-container">
  <Header />
  <main class="main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
    <slot />
  </main>
  <Footer {data} />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
  }
</style>
