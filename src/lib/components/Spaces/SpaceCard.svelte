<script lang="ts">
  import dayjs from "dayjs";
  import LocalizedFormat from "dayjs/plugin/localizedFormat";
  import { formatBTC, calculateTimeRemaining, displayUnicodeSpace } from "$lib/utils/formatters";
  dayjs.extend(LocalizedFormat);

  export let space;
  export let active;
  export let currentBlockHeight: number;
</script>

<div class="space-card">
  <a href={`/space/${space.name}`} class="space-card-link">
    <div class="space-card-container">
      <div class="space-card-header">
        <span title={space.name} class="space-name">{displayUnicodeSpace(space.name)}</span>
      </div>

      <div class="space-card-body">
        {#if active }
          {#if currentBlockHeight <= space.claim_height}
            <div class="status-container">
              <span class="status-label">Claimable at block {space.claim_height}</span>
              <span class="status-note">(in {calculateTimeRemaining(space.claim_height, currentBlockHeight)})</span>
            </div>
          {:else }
            <div class="status-container">
              <span class="status-badge">Can be claimed</span>
              <span class="status-note">(still open for bidding)</span>
            </div>
          {/if}
        {:else}
            <div class="status-container">
              <span class="status-badge">Last action at block {space.height}</span>
            </div>
        {/if}
      </div>

      <div class="space-card-footer">
        <div class="bid-info">
          <div class="bid-row">
            <span class="bid-label">Bids:</span>
            <span class="bid-value">{space.bid_count}</span>
          </div>
          <div class="bid-row">
            <span class="bid-label">Highest bid:</span>
            <span class="bid-value">{formatBTC(space.total_burned)}</span>
          </div>
        </div>
      </div>
    </div>
  </a>
</div>

<style>
  .space-card {
    height: 100%;
    width: 100%;
    display: block;
  }

  .space-card-link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }

  .space-card-container {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-6);
    border-radius: var(--border-radius-3xl);
    border: var(--border-width-1) solid var(--color-primary);
    border-bottom-width: var(--border-width-8);
    background: var(--bg-primary-light);
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .space-card-container:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .space-card-header {
    flex: 0 0 auto;
    margin-bottom: var(--space-4);
  }

  .space-name {
    font-weight: 600;
    font-size: var(--font-size-base);
    overflow-wrap: break-word;
    word-break: break-all;
    line-height: 1.3;
  }

  .space-card-body {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .space-card-footer {
    flex: 0 0 auto;
    margin-top: auto;
    padding-top: var(--space-4);
    border-top: var(--border-width-1) solid var(--border-color);
  }

  .status-container {
    min-height: 3.5rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    justify-content: center;
  }

  .status-label {
    font-size: var(--font-size-base);
    color: var(--font-size-muted);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    border-radius: var(--border-radius-lg);
    font-weight: 500;
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }

  .status-note {
    font-size: var(--font-size-sm);
    color: var(--font-size-muted);
  }

  .bid-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .bid-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-base);
    gap: var(--space-2);
  }

  .bid-label {
    color: var(--font-size-muted);
    flex-shrink: 0;
  }

  .bid-value {
    font-weight: 500;
    min-width: 85px;
    text-align: right;
  }

  @media (max-width: 640px) {
    .space-card-container {
      padding: var(--space-4);
      min-height: 180px;
      height: auto;
    }
    
    .space-card-footer {
      padding-top: var(--space-3);
      margin-top: var(--space-2);
    }

    .bid-value {
      min-width: 75px;
    }
  }
</style>
