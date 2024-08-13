<script lang="ts">
    import { goto } from "$app/navigation";
  import SortSelector from "$lib/components/SortSelector.svelte";
  import statusMeta from "$lib/statusMeta";
  import dayjs from "dayjs";
  import LocalizedFormat from "dayjs/plugin/localizedFormat";
  dayjs.extend(LocalizedFormat);

  const numberFormatter = new Intl.NumberFormat();

  let sortOptions = [
    { name: "Ended last", key: "register_date", direction: "desc" },
    { name: "Highest price", key: "price", direction: "desc" },
    { name: "Lowest price", key: "price", direction: "asc" },
  ];

  function onSortChange(sortBy: any) {
    const { key, direction } = sortBy.detail;
    let query = new URLSearchParams();
    query.set("sort", key);
    query.set("direction", direction);

    goto(`?${query.toString()}`);
  }

  export let data;
</script>

<div class="flex flex-col justify-center">
  <div class="w-full flex flex-col md:flex-row justify-between items-center md:pr-4 mt-5 mb-10 md:mb-16 gap-8 md:gap-0">
    <div class="hidden md:block md:w-1/3"></div>
    <h1 class="w-full md:w-1/3 text-center text-3xl font-semibold">Past Auctions</h1>
    <div class='w-[220px] md:w-[160px] mx-auto md:ml-auto md:mr-0 md:w-1/3 flex justify-center md:justify-end'>
      <SortSelector on:change={onSortChange} options={sortOptions} />
    </div>
  </div>
  <div class="grid gap-5" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
    {#each data.spaces ?? [] as space}
      <a href={`/space/${space.name.slice(1)}`} class="flex justify-center">
        <div
          class="group hover:z-10 relative group flex flex-col py-7 gap-2 rounded-3xl border border-b-8 border-primary w-[220px] cursor-pointer text-primary hover:bg-primary hover:text-primary-content hover:sc1ale-110 bg-base-100 transition-transform duration-300"
        >
          <div class="px-4 flex flex-col gap-2" >
            <span class="text-lg light:text-primary-content text-gray-400 font-semibold tracking-wider">{space.name}</span>
            <div class="text-xs my-2 rounded-2xl bg-{statusMeta[space.status].color} text-white text-center w-fit px-2 font-semibold py-[2px]">{statusMeta[space.status].name}</div>
            <div class="text-sm text-gray-600 group-hover:text-primary-content flex items-center">
              Number of bids: <span class="font-semibold ml-1 text-gray-400 light:text-primary-content">{space.history.filter((x) => x.action == "bid").length}</span>
            </div>
            <div class="text-sm text-gray-600 group-hover:text-primary-content flex items-center">
              Highest bid:
              <span class="font-semibold ml-1">{numberFormatter.format(space.history.filter((x) => x.action == "bid").pop()?.bid_amount)}</span>
              <span class="text-gray-500 group-hover:text-gray-500 ml-1 text-xs relative top-[.5px]">sat</span>
            </div>
          </div>
          <div
            class="invisible group-hover:visible overflow-hidden absolute px-4 pb-4 rounded-b-3xl group-hover:bg-primary top-[88%] z-20 max-h-0 group-hover:max-h-[200px] flex flex-col text-primary-content w-[220px] left-[-1px]"
            style="transition: max-height .7s"
          >
            <span class="font-semibold text-sm mb-1">Bids:</span>
            <div class="grid grid-cols-[auto_auto_1fr] w-full text-sm items-center">
              {#each space.history.filter((x) => x.action == "bid") as bid}
                <span class="group-hover:opacity-100 opacity-0 mr-[3px] font-semibold w-fit">{bid.bid_amount}</span>
                <span class="text-gray-500 text-xs ml-[1px] relative top-[0.5px]">SAT</span>
                <span class="text-xs text-right">{dayjs.unix(bid.transaction.block.time).format("MMM DD, hh:mm A")}</span>
              {/each}
            </div>
          </div>
        </div>
      </a>
    {/each}
    {#if !data.spaces.length}
      <span class="mx-auto text-gray-500">No past auctions</span>
    {/if}
  </div>
</div>
