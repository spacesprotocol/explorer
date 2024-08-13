<script lang="ts">
    import dayjs from 'dayjs';
    import LocalizedFormat from 'dayjs/plugin/localizedFormat';
    dayjs.extend(LocalizedFormat);

    const numberFormatter = new Intl.NumberFormat();
    export let data;
</script>

<div class="flex flex-col grow p-5 px-10 pt-0 md:pt-5 md:px-16 gap-5">
    <div class="flex flex-wrap gap-2 items-center mb-7">
        <h1 class="font-bold text-3xl">Transaction</h1> 
        <span class="top-1 relative break-all text-zinc-500">#{data.txid}</span>
    </div>
    <div class="flex flex-wrap gap-10">
        <a href="/block/{data.blockHash}">
            <div class="flex flex-col grow hover:opacity-90 gap-1">
                <span class='text-xl text-[#ec8e32] font-semibold'>{data.block.height}</span>
                <span class="text-gray-500">Block</span>
            </div>
        </a>
        <div class="flex flex-col grow gap-1">
            <span class='text-xl text-[#ec8e32] font-semibold'>{dayjs.unix(data.block.time).format('lll')}</span>
            <span class="text-gray-500">Time</span>
        </div>
        <div class="flex flex-col grow gap-1">
            <span class='text-xl text-[#ec8e32] font-semibold'>{data.version}</span>
            <span class="text-gray-500">Version</span>
        </div>
        <div class="flex flex-col grow gap-1">
            <span class='text-xl text-[#ec8e32] font-semibold'>{data.data.lock_time}</span>
            <span class="text-gray-500">Lock Time</span>
        </div>
        <div class="flex flex-col grow gap-1">
            <span class='text-xl text-[#ec8e32] font-semibold'>{data.block.confirmations}</span>
            <span class="text-gray-500">Confirmations</span>
        </div>
    </div>
    <div class="flex flex-wrap gap-5 mt-10">
        <div class="flex flex-col basis-full lg:basis-[45%] grow">
            <h2 class="text-xl mb-1 pb-2 border-b border-b-gray-500">Inputs</h2>
            <div class="flex flex-col gap-4 p-5 pl-1">
                {#each data.data.vin ?? [] as vin}
                    <div class="flex items-center">
                        <svg class="w-[16px] h-[16px] mr-4" fill="#ec8e32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
                        {#if vin.previous_output.split(':')[0].replaceAll('0', '').length == 0}
                            <span class="text-gray-500">Coinbase</span>
                        {:else}
                            <a href="{vin.previous_output.split(':')[0]}" class="text-gray-500 hover:text-[#ec8e32]">{vin.previous_output}</a>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
        <div class="flex flex-col basis-full lg:basis-[45%] grow">
            <h2 class="text-xl mb-1 pb-2 border-b border-b-gray-500">Outputs</h2>
            <div class="flex flex-col gap-4 p-5">
              {#each data.spaceHistories as event}
                    <a href="/space/{event.spaceName}" class="group">
                        <div class='grid grid-cols-3'>
                            <span class='text-gray-500'>{event.action[0].toUpperCase() + event.action.slice(1)}</span>
                            <a href="/space/{event.spaceName}" class='text-center group-hover:text-[#ec8e32]'>{event.spaceName}</a>
                            <span class="grow text-right">
                                {event.action == 'reject' ? ` ${event.meta.reason}`
                                : event.action == 'bid' ? ` ${numberFormatter.format(event.bid_amount)} sats` : ""
                                }</span>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    </div>
</div>