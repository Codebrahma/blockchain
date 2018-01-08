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
PUBLIC_KEY:0404b567f7216b4acb73d7f37bbaff70fd7e46ec772216d26cee262c212c86059587a373b0b8cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629
PRIVATE_KEY: 87d672b4f7172654c6ebe2bd997ab18097ffc8db230bddd80995fd9fca9540b2

04aca86afc1ace1ba19e1f45efe48eba492811e7d642f3979dc7567a3f4a58695b32b5f9a4eeebcdf8b8d4adaa555c002a9804a6b844afee37b47f96bc0a9757cd
