# Blockchain

A simple block chain implementation with node-js

It’s just an array of blocks, with each block having a connection to the previous one

To run, `DB_PATH=./db node app.js`


# Persistance
We use level-db to persist the block-chain.

Environment variable `DB_PATH` points to the database.

Lev for DB CLI : https://github.com/0x00A/lev

# Testing

```
# to run test
npm test
```


1) What's the miner's strategy ? should publish to as many compute nodes as possible

1) Class for network
2) Better Exception handling,
3) BUG: Key not found in database


3000: 04a75615fd0a421382c45897d10a3ac82a02d8b362480355cc121ee4c6cf22b1b85e39d169c7eee9261ff3d92badabad726632c0b8266ed5eaa0d3497fa28985ef

3001: 04a1e8f4efc57c6d1d742af0a7325d89cdcbd9e29d8ca39f0eb8d280b78bda200c72faf7d6c57347f295abd6ac9a21895dfd2d557bc833b62b3fa4fa51ec159d2c
