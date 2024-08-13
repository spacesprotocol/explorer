import { serial, text, pgTable, integer, bigint, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const blocks = pgTable('blocks', {
	id: serial('id').primaryKey(),
	hash: text('hash').notNull().unique(),
	confirmations: integer('confirmations').notNull(),
	height: bigint('height', { mode: 'number' }).notNull(),
	version: bigint('version', { mode: 'number' }).notNull(),
	merkleroot: text('merkleroot').notNull(),
	time: bigint('time', { mode: 'number' }).notNull(),
	mediantime: bigint('mediantime', { mode: 'number' }).notNull(),
	nonce: bigint('nonce', { mode: 'number' }).notNull(),
	bits: text('bits').notNull(),
	difficulty: numeric('difficulty').notNull(),
	chainwork: text('chainwork').notNull(),
	nTx: integer('n_tx').notNull(),
	previousblockhash: text('previousblockhash').notNull(),
	nextblockhash: text('nextblockhash'),
	strippedsize: integer('strippedsize').notNull(),
	size: bigint('size', { mode: 'number' }).notNull(),
	weight: bigint('weight', { mode: 'number' }).notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
});

export const blocksRelations = relations(blocks, ({ many }) => ({
	transactions: many(transactions),
}));

export const transactions = pgTable('transactions', {
	id: serial('id').primaryKey(),
	txid: text('txid').notNull().unique(),
	version: integer('version').notNull(),
	blockId: integer('block_id').notNull().references(() => blocks.id),
	blockHash: text('block_hash').notNull().references(() => blocks.hash),
	data: jsonb('data').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
});

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
	block: one(blocks, {
		fields: [transactions.blockId],
		references: [blocks.id],
	}),
	spaceHistories: many(spacesHistory),
}));

export const spaces = pgTable('spaces', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	nameSha256: text('name_sha256').notNull(),
	status: text('status').notNull(),
	bid_amount: integer('bid_amount'),
	claimHeight: integer('claim_height'),
	spacesHistoryId: integer('spaces_history_id').references(() => spacesHistory.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
});

export const spacesRelations = relations(spaces, ({ many }) => ({
	history: many(spacesHistory),
}));

export const spacesHistory = pgTable('spaces_history', {
	id: serial('id').primaryKey(),
	spaceName: text('space_name').notNull().references(() => spaces.name, { onDelete: 'cascade' }),
	spaceId: integer('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
	transactionId: integer('transaction_id').notNull().references(() => transactions.id),
	txid: text('txid').notNull().references(() => transactions.txid),
	action: text('action'),
	bid_amount: integer('bid_amount'),
	meta: jsonb('meta'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
});

export const spacesHistoryRelations = relations(spacesHistory, ({ one }) => ({
	space: one(spaces, {
		fields: [spacesHistory.spaceId],
		references: [spaces.id],
	}),	
	transaction: one(transactions, {
		fields: [spacesHistory.transactionId],
		references: [transactions.id],
	}),
}));

export const syncs = pgTable('syncs', {
	id: serial('id').primaryKey(),
	startBlockHeight: integer('start_block_height').notNull(),
	endBlockHeight: integer('end_block_height').notNull(),
	durationSeconds: integer('duration_seconds').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const blockStats = pgTable('block_stats', {
	id: serial('id').primaryKey(),
	blockHeight: integer('block_height'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
});