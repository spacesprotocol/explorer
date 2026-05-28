<script lang="ts">
    import CopyButton from '$lib/components/CopyButton.svelte';
    import type { AddressStats } from '$lib/types/address';
    import { formatBTC } from '$lib/utils/formatters';

    export let address: string;
    export let stats: AddressStats;

</script>

<div class="container">
    <div class="header">
        <h1 class="title">Address</h1> 
        <div class="flex items-center gap-2">
            <span class="hash">{address}</span>
            <CopyButton value={address} />
        </div>
    </div>
    <div class="details">
        <div class="detail-item">
            <span class="detail-value">{formatBTC(stats.balance)}</span>
            <span class="detail-label">Final Balance</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{formatBTC(stats.totalReceived)}</span>
            <span class="detail-label">Amount Received</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{formatBTC(stats.totalSpent)}</span>
            <span class="detail-label">Amount Sent</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{stats.txCount.toLocaleString()}</span>
            <span class="detail-label">Total Transactions</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{stats.receivedCount.toLocaleString()}</span>
            <span class="detail-label">Received</span>
        </div>
        <div class="detail-item">
            <span class="detail-value">{stats.spentCount.toLocaleString()}</span>
            <span class="detail-label">Spent</span>
        </div>
        <!--
        <div class="detail-item">
            <span class="detail-value">PLACEHOLDER</span>
            <span class="detail-label">Spaces Actions</span>
        </div>
        -->
    </div>
</div>
<style>
@import '$lib/styles/headers.css';
</style>
