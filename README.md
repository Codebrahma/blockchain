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

Genesis:
PUBLIC_KEY:0484efac84fc3652697fd7f7482fdf7250c73f39a05e8328f3ab4d4872e941f4f6cb31c88520672241b2877c522250fa960236d249879231250ee9250fa4a26945
PRIVATE_KEY: a048d40d79be472612a03f1d6b5c82f40f92d8e075d2ef40d9ad90363d24e2eb

04aca86afc1ace1ba19e1f45efe48eba492811e7d642f3979dc7567a3f4a58695b32b5f9a4eeebcdf8b8d4adaa555c002a9804a6b844afee37b47f96bc0a9757cd
