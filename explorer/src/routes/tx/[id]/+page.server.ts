import { error, type Actions, type ServerLoad, redirect } from '@sveltejs/kit';
import { object, string } from 'zod';
import { PUBLIC_BTC_NETWORK } from "$env/static/public";

export const load: ServerLoad = async ({ fetch, locals, params }) => {
    const transaction = await fetch(`/api/transactions/${params.id}`);
    if (transaction.status != 200)
        error(transaction.status, { message: 'Transaction not found'});
    
    const data = await transaction.json();
    const testnet = PUBLIC_BTC_NETWORK == "testnet4" ? "testnet4/" : "";
    if (!data.spaceHistories.length)
        redirect(302, `https://mempool.space/${testnet}tx/${params.id}`);

    return data;
};