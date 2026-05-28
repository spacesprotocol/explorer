// declare module 'punycode';

import * as punycode from 'punycode';
import { env } from '$env/dynamic/public';

export function formatNumberWithSpaces(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export const numberFormatter = {
    format: formatNumberWithSpaces
};

export function getActionColor(action: string): string {
    switch (action) {
        case 'RESERVE': return 'text-blue-500';
        case 'BID': return 'text-green-500';
        case 'TRANSFER': return 'text-purple-500';
        case 'ROLLOUT': return 'text-yellow-500';
        case 'REVOKE': return 'text-red-500';
        case 'COMMITMENT': return 'text-cyan-500';
        case 'COMMITMENT REVOCATION': return 'text-red-500';
        case 'DELEGATION': return 'text-indigo-500';
        case 'DELEGATION REVOCATION': return 'text-red-500';
        default: return 'text-gray-500';
    }
}

export function getHighestBid(vmetaouts): number {
    // Find the last rollout
    const lastRollout = vmetaouts
    .filter(v => v.action === 'ROLLOUT')
    .sort((a, b) => b.block_height - a.block_height)[0];

    // If no rollout, get highest bid from all bids
    if (!lastRollout) {
        return Math.max(0, ...vmetaouts .filter(v => v.action === 'BID') .map(v => Number(v.total_burned ?? 0)));
    }

    // Get the last bid before rollout and all bids after
    const relevantBids = vmetaouts
    .filter(v => v.action === 'BID' && (v.block_height > lastRollout.block_height ||
                                        v === vmetaouts .filter(bid => bid.action === 'BID' && bid.block_height < lastRollout.block_height)
    .sort((a, b) => b.block_height - a.block_height)[0]));

    return Math.max(0, ...relevantBids.map(v => Number(v.total_burned ?? 0)));
}



export function calculateTimeRemaining(targetHeight: number, currentHeight: number): string {
    const BLOCK_TIME_MINUTES = 10;

    if (targetHeight <= currentHeight) {
        return "Recently";
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

export function formatBTC(satoshis: number | undefined): string {
    if (satoshis === undefined || satoshis === null) {
        return '0 sat';
    }
    const BTC_THRESHOLD = 10000n;
    if (satoshis >= BTC_THRESHOLD) {
        const btc = Number(satoshis) / 100000000;
        const btcString = btc.toString();
        const [whole, decimal] = btcString.split('.');
        
        // Format whole number part with spaces
        const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        if (!decimal) {
            return `${formattedWhole} BTC`;
        }
        
        // Find last non-zero digit
        const lastSignificantIndex = decimal.split('').reverse().findIndex(char => char !== '0');
        if (lastSignificantIndex === -1) {
            return `${formattedWhole} BTC`;
        }
        
        // Calculate required decimal places (minimum 3, maximum 8)
        const significantDecimals = Math.max(3, Math.min(8, decimal.length - lastSignificantIndex));
        const formattedDecimal = decimal.slice(0, significantDecimals);
        
        return `${formattedWhole}.${formattedDecimal} BTC`;
    }
    // Format satoshis with spaces
    return satoshis.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' sat';
}


/**
 * Normalizes a space name by removing '@' prefix and converting to lowercase
 *
 * @param {string} space - The space name to normalize
 * @returns {string} - The normalized space name
 */
export function normalizeSpace(space: string): string {
  if (!space) return '';
  space = space.startsWith('@') ? space.substring(1) : space;
  return space.toLowerCase();
}

/**
 * Checks if a space name is in punycode format
 *
 * @param {string} space - The space name to check
 * @returns {boolean} - True if in punycode format
 */
export function isPunycode(space: string): boolean {
  if (!space || typeof space !== 'string') {
    return false;
  }
  
  return space.includes('xn--');
}

/**
 * Converts a Punycode (ASCII) space name to Unicode for display
 *
 * @param {string} space - The Punycode space name
 * @returns {string} - The Unicode representation
 */
export function spaceToUnicode(space: string): string {
  try {
    // Skip conversion if not punycode
    if (!space.includes('xn--')) {
      return space;
    }

    // Split space into parts
    const parts = space.split('.');

    // Convert each xn-- part to unicode
    const unicodePartsArray = parts.map(part => {
      if (part.startsWith('xn--')) {
        // Remove the xn-- prefix and decode
        return punycode.decode(part.slice(4));
      }
      return part;
    });

    // Join parts back with dots
    return unicodePartsArray.join('.');
  } catch (error) {
    console.error('Error converting to Unicode:', error);

    // Remove the Intl.DisplayNames fallback as it's causing TypeScript errors
    // and the main punycode method should be sufficient
    return space;
  }
}

/**
 * Converts a Unicode space name to Punycode (ASCII)
 *
 * @param {string} space - The Unicode space name
 * @returns {string} - The Punycode representation
 */
export function spaceToPunycode(space: string): string {
  try {
    // First normalize
    space = normalizeSpace(space);

    // Skip conversion if already punycode
    if (isPunycode(space)) {
      return space;
    }

    // Split space into parts
    const parts = space.split('.');

    // Convert each Unicode part to punycode if needed
    const punycodePartsArray = parts.map(part => {
      // Check if part contains non-ASCII characters
      if (/[^\x00-\x7F]/.test(part)) {
        return 'xn--' + punycode.encode(part);
      }
      return part;
    });

    // Join parts back with dots
    return punycodePartsArray.join('.');
  } catch (error) {
    console.error('Error converting to Punycode:', error);

    // Fallback to browser's URL constructor
    try {
      const url = new URL(`https://${space}`);
      return url.hostname;
    } catch (urlError) {
      console.error('URL fallback failed:', urlError);
      return space;
    }
  }
}

export function displayUnicodeSpace(space : string) {
    if (isPunycode(space)) {
        const decoded = spaceToUnicode(space);
        if (decoded !== space) {
            return `${space} (${decoded})`;
        }
    }
    return `${space}`
}

/**
 * Gets the correct mempool.space URL based on the Bitcoin network
 *
 * @param {string} path - The path to append (e.g., 'tx/abc123')
 * @returns {string} - The full mempool.space URL
 */
export function getMempoolUrl(path: string): string {
    const isTestnet = env.PUBLIC_BTC_NETWORK && env.PUBLIC_BTC_NETWORK !== 'mainnet';
    const network = isTestnet ? `${env.PUBLIC_BTC_NETWORK}/` : '';
    return `https://mempool.space/${network}${path}`;
}


