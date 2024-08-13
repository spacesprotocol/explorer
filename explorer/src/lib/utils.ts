import { bech32m } from 'bech32'; 
import { Buffer } from 'buffer';

export function calculateTimeRemaining(targetHeight: number, currentHeight: number): string {
    const BLOCK_TIME_MINUTES = 10;

    if (targetHeight <= currentHeight) {
        return 0;
    }

    const remainingBlocks = targetHeight - currentHeight;
    const totalMinutesRemaining = remainingBlocks * BLOCK_TIME_MINUTES;

    const days = Math.floor(totalMinutesRemaining / (24 * 60));
    const hours = Math.floor((totalMinutesRemaining % (24 * 60)) / 60);
    const minutes = totalMinutesRemaining % 60;

    return `${days}d ${hours}h ${minutes}m`;
}

export function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    let result = '';
    if (days > 0) result = `${days} day${days > 1 ? 's' : ''}`;
    else if (hours > 0) result = `${hours} hour${hours > 1 ? 's' : ''}`;
    else result = `${minutes} minute${minutes > 1 ? 's' : ''} `;

    return result;
}

export function decodeScriptPubKeyToTaprootAddress(scriptPubKey, network = 'mainnet') {
    if (!scriptPubKey.startsWith('5120') || scriptPubKey.length !== 68) {
        throw new Error('Invalid P2TR ScriptPubKey');
    }

    // Extract the 32-byte public key (after '5120')
    const pubkeyHex = scriptPubKey.slice(4);
    const pubkeyBytes = Buffer.from(pubkeyHex, 'hex');

    // Determine the HRP (Human-Readable Part) based on the network
    const hrp = network === 'mainnet' ? 'bc' : 'tb';

    // Convert bytes to 5-bit groups (Bech32m)
    const pubkeyBits = bech32m.toWords(pubkeyBytes);

    // Create the address with a version 1 witness program
    const address = bech32m.encode(hrp, [1].concat(pubkeyBits));

    return address;
}