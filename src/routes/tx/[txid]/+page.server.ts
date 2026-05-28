import { error } from '@sveltejs/kit';
import {  type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch, params }) => {
    const transaction = await fetch(`/api/transactions/${params.txid}`);
    if (transaction.status != 200)
        error(transaction.status, { message: 'Transaction not found'});
    
    const data = await transaction.json();

    // const testnet = PUBLIC_BTC_NETWORK == "testnet4" ? "testnet4/" : "";
    // if (!data.spaceHistories.length)
    //     redirect(302, `https://mempool.space/${testnet}tx/${params.txid}`);

    return data;
};
