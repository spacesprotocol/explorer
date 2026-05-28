<script lang="ts">
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import { formatBTC } from '$lib/utils/formatters';
    dayjs.extend(LocalizedFormat);
    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    let loading = true;
    let error = null;
    let stats = {
        latest_block_height: 0,
        latest_block_time: 0,
        unique_names_count: 0,
        valid_vmetaouts_count: 0,
        total_burned_sum: 0,
        bid_count: 0,
        transfer_count: 0,
        rollout_count: 0,
        revoke_count: 0
    };

    onMount(async () => {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            stats = data;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    });
</script>

{#if loading}
    <div class="container">
        <span class="detail-value">Loading statistics...</span>
    </div>
{:else if error}
    <div class="container">
        <span class="detail-value text-red-500">Error loading statistics: {error}</span>
    </div>
{:else}
    <div class="container">
        <!--
        <div class="header">
            <h1 class="title">Spaces statistics</h1> 
        </div>
        -->
        <div class="details">
            <div class="detail-item">
                <a href={`/block/${stats.latest_block_height}`}>
                    <span class="detail-value">#{stats.latest_block_height}</span>
                    <span class="detail-time">
                        {#if dayjs.unix(stats.latest_block_time).isAfter(dayjs())}
                            (just recently)
                        {:else}
                            ({dayjs.unix(stats.latest_block_time).fromNow()})
                        {/if}
                    </span>


                </a>
                <span class="detail-label">Latest block</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.unique_names_count}</span>
                <span class="detail-label">Spaces</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.valid_vmetaouts_count}</span>
                <span class="detail-label">Events</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{formatBTC(stats.total_burned_sum)}</span>
                <span class="detail-label">Total burned</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.bid_count}</span>
                <span class="detail-label">Bids</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.transfer_count}</span>
                <span class="detail-label">Transfers and registers</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.rollout_count}</span>
                <span class="detail-label">Rollouts</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">{stats.revoke_count}</span>
                <span class="detail-label">Revokes</span>
            </div>
        </div>
    </div>
{/if}

<style>
@import '$lib/styles/variables.css';

.container {
    width: 100%;
    max-width: var(--max-width-4xl);
    margin: 0 auto;
    background-color: var(--bg-content);
    border-radius: var(--rounded-lg);
    padding: var(--space-6);
}

.details {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: var(--space-6);
}

@media (min-width: 768px) {
    .details {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .details {
        grid-template-columns: repeat(4, 1fr);
    }
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.detail-value {
    display: block;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-semibold);
    color: var(--font-size-default);
}

.detail-label {
    font-size: var(--font-size-sm);
    color: var(--font-size-muted);
}
</style>
