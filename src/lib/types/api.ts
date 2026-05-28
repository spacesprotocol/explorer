export type CovenantAction = 'RESERVE' | 'BID' | 'TRANSFER';

export type ApiSearchResponse = {
  block?: Block;
  transaction?: Transaction;
  names?: string[];
};

export type Vmetaout = {
  block_hash: Bytes;
  txid: Bytes;
  tx_index: number;
  outpoint_txid: Bytes;
  outpoint_index: number;
  name: string;
  burn_increment: number | null;
  covenant_action: CovenantAction;
  claim_height: number | null;
  expire_height: number | null;
};

// Translated Bytes type (from Go []byte)
export type Bytes = Uint8Array;

export type Block = {
  hash: Bytes;
  size: number;
  stripped_size: number;
  weight: number;
  height: number;
  version: number;
  hash_merkle_root: Bytes;
  time: number;
  median_time: number;
  nonce: number;
  bits: Bytes;
  difficulty: number;
  chainwork: Bytes;
  orphan: boolean;
};

export type Transaction = {
  txid: Bytes;
  tx_hash: Bytes | null;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  fee: number;
  block_hash: Bytes | null;
  index: number | null;
};

export type TxInput = {
  block_hash: Bytes;
  txid: Bytes;
  index: number;
  hash_prevout: Bytes | null;
  index_prevout: number;
  sequence: number;
  coinbase: Bytes | null;
  txinwitness: Bytes[];
};

export type TxOutput = {
  block_hash: Bytes;
  txid: Bytes;
  index: number;
  value: number;
  scriptpubkey: Bytes | null;
};

