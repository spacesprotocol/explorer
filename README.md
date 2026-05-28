# Spaces Protocol Explorer

A web block explorer for the [Spaces Protocol](https://explorer.spacesprotocol.org). Browse blocks, transactions, spaces, auctions, space pointers.
Frontend gets data only from the database, it doesn't connect to a bitcoin node, neither to a space daemon.

It's possible to browse mempool transactions (however without `sptr` data, it will be added once `getsptrpackage` or
something similar is added to spaced).

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Database**: PostgreSQL, it imports drizzle ORM, however it only uses raw SQL queries (for perfomance reason)
- **Styling**: TailwindCSS + DaisyUI
- **Runtime**: Node.js


## Prerequisites

- Node.js 18+
- PostgreSQL database with spaces protocol data

For the actual schema, please refer to the [indexer repository](http://github.com/spacesprotocol/indexer).

## Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env.local`:
   ```
   DB_URL=postgres://user:password@localhost/spaces_protocol_explorer
   PUBLIC_BTC_NETWORK=testnet4   # or mainnet
   MARKETPLACE_URI=https://spaces.market
   ```

   MARKETPLACE_URI is used in conjunction with spaces marketplace to show the users whether a particular space is on the
   secondary market.
   Consult [spaces protocol secondary marketplace repository](https://github.com/spaceprotocol/marketplace) for the
   exact API used.

4. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:5173

## Production

Build and run:
```bash
npm run build
node build/server.js
```

The server runs on port 3000 by default.

Consider using docker for the production setup.

## Notes

Type definitions might be out of date.

Some CSS styling is inconsistent and redefined and per page basis. 

Same stands for the code style: use your own linter settings.

Previously the explorer indexed the whole blockchain data from the genesis block, also it indexed the addresses,
therefore some remnants of this structure might be present in the repository, despite them not being used live.

The routes can be found in `src/routes`, they contain both `api` routes and the frontend routes.
Reusable components can be found in `src/lib/components`

## License

MIT
