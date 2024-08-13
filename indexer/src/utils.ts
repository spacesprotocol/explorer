import { bech32m } from 'bech32'; 
import crypto from 'crypto';

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

export function sha256SpaceName(spaceName) {
  const byteArray = Buffer.from(spaceName, 'utf8');
  const lengthPrefix = Buffer.from([byteArray.length]);
  const lengthPrefixedByteArray = Buffer.concat([lengthPrefix, byteArray]);
  const finalByteArray = Buffer.concat([lengthPrefixedByteArray, Buffer.from([0])]);
  const sha256Hash = crypto.createHash('sha256').update(finalByteArray).digest('hex');

  return sha256Hash;
}