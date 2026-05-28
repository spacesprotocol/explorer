<script lang="ts">
    import { formatBTC, displayUnicodeSpace, getActionColor } from '$lib/utils/formatters';
    import { parseAddress } from '$lib/utils/address-parsers';
    import { Buffer } from 'buffer';
    import { fly } from 'svelte/transition';
    import type { SpaceCommitment, SpaceDelegation } from '$lib/types/transaction';

    export let vmetaouts;
    export let commitments: SpaceCommitment[] = [];
    export let delegations: SpaceDelegation[] = [];

    export let maxDisplay = 5;
    export let showAll = false;

    // Combine vmetaouts, commitments, and delegations as events - normalize to common structure
    // Sort commitments so non-revocations come before revocations for the same space
    $: allEvents = [
        ...vmetaouts,
        ...commitments
            .sort((a, b) => {
                // If same name, non-revocations come first (commitment before revocation)
                if (a.name === b.name) {
                    return (a.revocation ? 1 : 0) - (b.revocation ? 1 : 0);
                }
                return 0;
            })
            .map((c: SpaceCommitment) => ({
                name: c.name,
                action: c.revocation ? 'COMMITMENT REVOCATION' : 'COMMITMENT',
                state_root: c.state_root,
                revocation: c.revocation,
                history_hash: c.history_hash,
                // No other vmetaout fields for commitments
                value: null,
                burn_increment: null,
                total_burned: null,
                claim_height: null,
                expire_height: null,
                script_error: null,
                scriptPubKey: null,
                signature: null,
                reason: c.revocation ? 'commitment_revoked' : null,
                sptr: null
            })),
        ...delegations.map((d: SpaceDelegation) => ({
                name: d.name,
                action: 'DELEGATION',
                sptr: d.sptr,
                // No other vmetaout fields for delegations
                value: null,
                burn_increment: null,
                total_burned: null,
                claim_height: null,
                expire_height: null,
                script_error: null,
                scriptPubKey: null,
                signature: null,
                reason: null,
                state_root: null,
                history_hash: null,
                revocation: false
            }))
    ];

    $: displayCount = showAll ? allEvents.length : Math.min(maxDisplay, allEvents.length);

    function formatReason(reason: string): string {
        return reason
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function getTransferAddress(scriptPubKey: string): string | null {
        try {
            const buffer = Buffer.from(scriptPubKey, 'hex');
            return parseAddress(buffer);
        } catch (error) {
            console.warn('Failed to parse transfer address:', error);
            return null;
        }
    }
</script>

<div class="vmetaouts-section">
    <h4 class="section-title">Spaces Events</h4>
    <div class="section-content">
        {#each allEvents.slice(0, displayCount) as vmetaout, index (`${vmetaout.name}_${vmetaout.action}`)}
            <div class="vmetaout-item" transition:fly={{ y: 20, duration: 300, delay: index * 50 }} >
                <div class="vmetaout-header">
                    <div class="name-action">
                        <a href="/space/{vmetaout.name}" class="space-name">
                            {displayUnicodeSpace(vmetaout.name)}
                        </a>
                        {#if vmetaout.action}
                            <span class="dot">•</span>
                            <span class="action-type {getActionColor(vmetaout.action)}">
                                {vmetaout.action}
                            </span>
                        {/if}
                        {#if vmetaout.action === 'BID'}
                            <span class="dot">•</span>
                            <span class="bid-value">{formatBTC(vmetaout.total_burned)}</span>
                        {/if}
                    </div>
                </div>
                {#if vmetaout.action === 'REVOKE' && vmetaout.reason}
                    <div class="revoke-reason">
                        Revoked due to: {formatReason(vmetaout.reason)}
                    </div>
                {/if}

                <div class="vmetaout-details">
                    {#if vmetaout.action === 'TRANSFER' && vmetaout.scriptPubKey}
                        {@const address = getTransferAddress(vmetaout.scriptPubKey)}
                        {#if address}
                            <div class="detail-item address-item">
                                <span class="detail-label">Transferred to</span>
                                <span class="detail-value">{address}</span>
                            </div>
                        {/if}
                    {/if}
                    {#if vmetaout.burn_increment && vmetaout.action !== 'REVOKE'}
                        <div class="detail-item">
                            <span class="detail-label">Burn Increment</span>
                            <span class="detail-value">{formatBTC(vmetaout.burn_increment)}</span>
                        </div>
                    {/if}
                    {#if vmetaout.total_burned}
                        <div class="detail-item">
                            <span class="detail-label">Total Burned</span>
                            <span class="detail-value">{formatBTC(vmetaout.total_burned)}</span>
                        </div>
                    {/if}
                    {#if vmetaout.claim_height}
                        <div class="detail-item">
                            <span class="detail-label">Claim Height</span>
                            <span class="detail-value">{vmetaout.claim_height}</span>
                        </div>
                    {/if}
                    {#if vmetaout.expire_height}
                        <div class="detail-item">
                            <span class="detail-label">Expire Height</span>
                            <span class="detail-value">{vmetaout.expire_height}</span>
                        </div>
                    {/if}
                    {#if vmetaout.state_root}
                        <div class="detail-item address-item">
                            <span class="detail-label">State Root {vmetaout.revocation ? '(Revoked)' : ''}</span>
                            <span class="detail-value mono-text" class:strikethrough={vmetaout.revocation}>{vmetaout.state_root}</span>
                        </div>
                    {/if}
                    {#if vmetaout.history_hash}
                        <div class="detail-item address-item">
                            <span class="detail-label">History Hash</span>
                            <span class="detail-value mono-text">{vmetaout.history_hash}</span>
                        </div>
                    {/if}
                    {#if vmetaout.sptr}
                        <div class="detail-item address-item">
                            <span class="detail-label">SPTR</span>
                            <a href="/sptr/{vmetaout.sptr}" class="detail-value mono-text sptr-link">{vmetaout.sptr}</a>
                        </div>
                    {/if}

                </div>

                {#if vmetaout.script_error}
                    <div class="error-message">
                        <span class="error-label">Script Error:</span>
                        <span class="error-text">{vmetaout.script_error}</span>
                    </div>
                {/if}

                    </div>
        {/each}

        {#if allEvents.length > maxDisplay && !showAll}
            <button
                class="show-more"
                on:click={() => showAll = true}
                >
                Show {allEvents.length - maxDisplay} more events
            </button>
        {/if}
            </div>
    </div>

<style>
    @import '$lib/styles/common.css';

    .vmetaouts-section {
        width: 100%;
        background: var(--bg-secondary);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--border-radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
    }

    .section-title {
        font-size: var(--font-size-xl);
        padding: var(--space-4) var(--space-6);
        margin: 0;
        border-bottom: var(--border-width-1) solid var(--border-color);
        background: var(--bg-secondary);
    }

    .section-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-6);
    }

    .vmetaout-item {
        background: var(--bg-primary);
        border-radius: var(--border-radius-lg);
        padding: var(--space-4);
        border: var(--border-width-1) solid var(--border-color);
        transition: var(--transition-all);
    }

    .vmetaout-item:hover {
        transform: translateY(-2px);
        border-color: var(--border-hover);
        box-shadow: var(--shadow-md);
    }

    .vmetaout-header {
        margin-bottom: var(--space-2);
    }

    .name-action {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-size-xl);
    }

    .space-name {
        font-weight: 700;
        text-decoration: none;
    }

    .space-name:hover {
        text-decoration: underline;
    }

    .sptr-link {
        color: var(--color-link);
        text-decoration: none;
    }

    .sptr-link:hover {
        text-decoration: underline;
    }

    .dot {
        color: var(--font-size-muted);
    }

    .revoke-reason {
        margin-bottom: var(--space-4);
        padding: var(--space-3);
        background-color: rgb(254 226 226);
        color: rgb(185 28 28);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
    }

    .bid-value {
        font-weight: 600;
        color: rgb(22 163 74);
    }

    .vmetaout-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-4);
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 0;
    }

    .address-item {
        grid-column: 1 / -1;
    }

    .detail-label {
        color: var(--font-size-muted);
        font-size: var(--font-size-lg);
    }

    .detail-value {
        font-size: var(--font-size-lg);
        font-weight: 500;
        word-break: break-all;
        overflow-wrap: break-word;
    }

    .mono-text {
        font-family: monospace;
        font-size: var(--font-size-sm);
    }

    .strikethrough {
        text-decoration: line-through;
        opacity: 0.6;
    }

    .error-message {
        margin-top: var(--space-4);
        padding: var(--space-3);
        background-color: rgb(254 226 226);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
    }

    .error-label {
        font-weight: 500;
        color: rgb(185 28 28);
        margin-right: var(--space-2);
    }

    .error-text {
        color: rgb(185 28 28);
    }

    .show-more {
        margin-top: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--bg-surface);
        border: var(--border-width-1) solid var(--border-color);
        border-radius: var(--radius-full);
        color: var(--font-size-muted);
        font-size: var(--font-size-sm);
        cursor: pointer;
    }

    .show-more:hover {
        background: var(--bg-surface-hover);
        color: var(--font-size-base);
    }
</style>
