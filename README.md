# SpacesProtocol Explorer & Indexer

This is a monorepo containing two projects located in the `explorer` and `indexer` directories.

## Indexer

Indexer is a  script written in TypeScript that runs every minute and fetches new blocks from `bitcoind` daemon, queries `spaced` for information about the fetched blocks and writes the relevant information to the database.

### Prerequisites

Make sure to install:

- Bitcoin Core: <https://bitcoincore.org/en/download/>
- Rust: <https://www.rust-lang.org/tools/install>

### Testnet sync

After installing Bitcoin Core, create a directory for Bitcoin testnet data:

```bash
mkdir $HOME/bitcoin-testnet

# Create a configuration file with RPC credentials
echo "rpcuser=test" > $HOME/bitcoin-testnet/bitcoin.conf
echo "rpcpassword=test" >> $HOME/bitcoin-testnet/bitcoin.conf

# Start Bitcoin Core in testnet mode
bitcoind -testnet -datadir=$HOME/bitcoin-testnet
```

Spaces protocol is activated on Bitcoin testnet block `2865460` - wait for bitcoind to sync up to that block before proceeding.

### Install spaced

spaced is a tiny layer on top of Bitcoin Core allowing you to interact with Spaces. To compile spaced, you need to install Rust and then

```bash
# Clone the repository
git clone https://github.com/spacesprotocol/spaced && cd spaced

# Build the release version
cargo build --release

# Install the binaries
cargo install --path node

# Ensure Cargo's bin directory is in your PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify you have spaced and space-cli installed:

```bash
spaced --version
space-cli --version
```

### Connect to Bitcoin Core

Make sure to run `spaced` with block indexing enabled:

```bash
spaced --chain test --block-index --bitcoin-rpc-user test --bitcoin-rpc-password test
```

### Preparing the Indexer

Install dependencies:

``` bash
cd indexer
npm install
```

Create an `.env` file:

```bash
cp .env.example .env
```

If needed, make changes to the `.env` file but if you fully followed this guide everything should work with the default values.

### Setting up Postgres database

Same database is used by both the Explorer and the Indexer.

You can start the database using Docker or set up your own database.

To run it via Docker run the following command from the root directory, i.e. the directory where the `docker-compose.yml` is located:

```bash
docker compose up -d
```

Create the database schema:

```bash
cd indexer
npx drizzle-kit push
```

### Starting the Indexer

You can start the indexer directly in the terminal or make it run in the background using `pm2` and have it running even when you exit the terminal.

To start it in the terminal run:

```bash
npm run start
```

To run it via `pm2` make sure to first install `pm2`:

```bash
npm i -g pm2
```

Then build the app and run it:

```bash
npm run build
pm2 start dist/index.js
```

Make sure it's running:

```bash
pm2 status
```

## Explorer

### Install dependencies

```bash
cd explorer
npm install
```

### Add an `.env` file

```bash
cp .env.example .env
```

If needed, make changes to the `.env` file but if you fully followed this guide everything should work with the default values.

### Run the explorer

You can start the explorer directly in the terminal or make it run in the background using `pm2` and have it running even when you exit the terminal.

To start it in the terminal run:

```bash
npm run dev
```

Then you can open the browser at: `http://localhost:5173/`

To run it via `pm2` make sure to first install `pm2`:

```bash
npm i -g pm2
```

Then build the app and run it:

```bash
npm run build
pm2 start build/server.js
```

Make sure it's running:

```bash
pm2 status
```

You can then open the explorer in a browser: `http://localhost:3000`
