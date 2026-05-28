import { bech32, bech32m } from 'bech32';
import bs58 from 'bs58';
import { env } from "$env/dynamic/public";
import { Buffer } from 'buffer';
import { sha256 as sha256Hasher } from '@noble/hashes/sha256';

function sha256Sync(data: Uint8Array): Uint8Array {
    return sha256Hasher.create().update(data).digest();
}

export function parseAddress(scriptPubKey: Buffer): string | null {
    return parseP2PKHScriptPubKey(scriptPubKey) ||
           parseP2SHScriptPubKey(scriptPubKey) ||  // Added P2SH parsing
           parseP2WPKH(scriptPubKey) ||
           parseP2WSH(scriptPubKey) ||
           decodeScriptPubKeyToTaprootAddress(scriptPubKey, env.PUBLIC_BTC_NETWORK);
}

export function parseP2SHScriptPubKey(scriptPubKey: Buffer): string | null {
    // Check P2SH pattern: OP_HASH160 (0xa9) + Push 20 bytes (0x14) + <20 bytes> + OP_EQUAL (0x87)
    if (scriptPubKey.length !== 23 ||
        scriptPubKey[0] !== 0xa9 ||
        scriptPubKey[1] !== 0x14 ||
        scriptPubKey[22] !== 0x87) {
        return null;
    }

    const scriptHash = scriptPubKey.slice(2, 22);
    const prefix = env.PUBLIC_BTC_NETWORK === 'mainnet' ? 0x05 : 0xc4;  // 0x05 for mainnet, 0xc4 for testnet
    const payload = Buffer.concat([Buffer.from([prefix]), scriptHash]);

    // Double SHA256 for checksum
    const hash1 = sha256Sync(payload);
    const hash2 = sha256Sync(hash1);
    const checksum = hash2.slice(0, 4);

    // Combine version, script hash, and checksum
    const finalPayload = Buffer.concat([payload, Buffer.from(checksum)]);

    return bs58.encode(finalPayload);
}

export function decodeScriptPubKeyToTaprootAddress(scriptPubKey: Buffer, network = 'mainnet') {
    if (scriptPubKey.length !== 34 || scriptPubKey[0] !== 0x51 || scriptPubKey[1] !== 0x20) {
        return null;
    }
    const pubkeyBytes = scriptPubKey.slice(2);
    const hrp = network === 'mainnet' ? 'bc' : 'tb';
    const pubkeyBits = bech32m.toWords(pubkeyBytes);
    return bech32m.encode(hrp, [1].concat(pubkeyBits));
}

export function parseP2PKHScriptPubKey(scriptPubKey: Buffer): string | null {
    if (scriptPubKey.length !== 25 ||
        scriptPubKey[0] !== 0x76 ||
        scriptPubKey[1] !== 0xa9 ||
        scriptPubKey[2] !== 0x14 ||
        scriptPubKey[23] !== 0x88 ||
        scriptPubKey[24] !== 0xac) {
        return null;
    }

    const pubKeyHash = scriptPubKey.slice(3, 23);
    const prefix = env.PUBLIC_BTC_NETWORK === 'mainnet' ? 0x00 : 0x6f;
    const payload = Buffer.concat([Buffer.from([prefix]), pubKeyHash]);

    // Calculate checksum (double SHA256)
    const hash = sha256Sync(payload);
    const hash2 = sha256Sync(hash);
    const checksum = hash2.slice(0, 4);

    // Combine version, pubkey hash, and checksum
    const finalPayload = Buffer.concat([payload, checksum]);

    return bs58.encode(finalPayload);
}

export function parseP2WPKH(scriptPubKey: Buffer) {
    if (scriptPubKey.length !== 22 || scriptPubKey[0] !== 0x00 || scriptPubKey[1] !== 0x14) {
        return null;
    }
    const pubKeyHash = scriptPubKey.slice(2);
    const words = bech32m.toWords(pubKeyHash);
    const prefix = env.PUBLIC_BTC_NETWORK === 'mainnet' ? 'bc' : 'tb';
    return bech32m.encode(prefix, [0].concat(words));
}

export function parseP2WSH(scriptPubKey: Buffer) {
    if (scriptPubKey.length !== 34 || scriptPubKey[0] !== 0x00 || scriptPubKey[1] !== 0x20) {
        return null;
    }
    const scriptHash = scriptPubKey.slice(2);
    const words = bech32m.toWords(scriptHash);
    const prefix = env.PUBLIC_BTC_NETWORK === 'mainnet' ? 'bc' : 'tb';
    return bech32m.encode(prefix, [0].concat(words));
}


export function addressToScriptPubKey(address: string): string {
    try {
        // Handle bech32/bech32m addresses (starting with bc1 or tb1)
        if (address.toLowerCase().startsWith('bc1') || address.toLowerCase().startsWith('tb1')) {
            let decoded;
            try {
                // Try bech32m first (for taproot addresses)
                decoded = bech32m.decode(address);
            } catch {
                // Fall back to bech32 (for SegWit v0 addresses)
                decoded = bech32.decode(address);
            }

            const words = decoded.words;
            const version = words[0];
            const data = Buffer.from(bech32.fromWords(words.slice(1)));

            // P2WPKH (version 0, length 20)
            if (version === 0 && data.length === 20) {
                return Buffer.concat([
                    Buffer.from('0014', 'hex'), // OP_0 + Push 20 bytes
                    data
                ]).toString('hex');
            }

            // P2WSH (version 0, length 32)
            if (version === 0 && data.length === 32) {
                return Buffer.concat([
                    Buffer.from('0020', 'hex'), // OP_0 + Push 32 bytes
                    data
                ]).toString('hex');
            }

            // P2TR (Taproot, version 1, length 32)
            if (version === 1 && data.length === 32) {
                return Buffer.concat([
                    Buffer.from('5120', 'hex'), // OP_1 + Push 32 bytes
                    data
                ]).toString('hex');
            }

            throw new Error('Unsupported witness version or program length');
        }

        // Legacy address decoding
        const decoded = Buffer.from(bs58.decode(address));
        const version = decoded[0];
        const hash = decoded.slice(1, -4); // Remove version byte and checksum

        // P2PKH (starts with 1 or m/n)
        if (version === 0x00 || version === 0x6f) {
            return Buffer.concat([
                Buffer.from('76a914', 'hex'), // OP_DUP + OP_HASH160 + Push 20 bytes
                hash,
                Buffer.from('88ac', 'hex')    // OP_EQUALVERIFY + OP_CHECKSIG
            ]).toString('hex');
        }

        // P2SH (starts with 3 or 2)
        if (version === 0x05 || version === 0xc4) {
            return Buffer.concat([
                Buffer.from('a914', 'hex'),   // OP_HASH160 + Push 20 bytes
                hash,
                Buffer.from('87', 'hex')      // OP_EQUAL
            ]).toString('hex');
        }

        throw new Error('Unsupported address format');

    } catch (error) {
        console.error('Error converting address to scriptPubKey:', error);
        throw error;
    }
}
