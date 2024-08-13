import { error, type Actions, type ServerLoad, redirect } from '@sveltejs/kit';
import { object, string } from 'zod';

export const load: ServerLoad = async ({ fetch, locals, params }) => {
    const transaction = await fetch(`/api/transactions/${params.id}`);
    if (transaction.status != 200)
        error(transaction.status, { message: 'Transaction not found'});
    
    const data = await transaction.json();
    if (!data.spaceHistories.length)
        redirect(302, `https://mempool.space/testnet/tx/${params.id}`);

    return data;
};