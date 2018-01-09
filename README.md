#  CB Chain
A blockchain built from scratch for learning.

## Nmap service
Highlevel service which maintains the list of active nodes in the blockchain network. It unregisters nodes within 60s of no heartbeat.
```
node nmap.js
```

## Genesis block and miner ( only once for the network )
```
NODE_ID=3000 DB_PATH=./db node app.js createWallet
# Creates keys => pubkey 0400ea77060547eb078aed59c2e120b94ccf3a01b837e69d0244838c9d9991606c027d2a59121b8b0f4a1c659e60cbedd4055f779d2bfe975d59bb02973f6bad2f [GENESIS_MINER]
# Create Genesis block ( run only once )
NODE_ID=3000 DB_PATH=./db BLOCKCHAIN_MINER=[GENESIS_MINER] node app.js initChain --minerAddress [GENESIS_MINER]
# Begin mining
NODE_ID=3000 DB_PATH=./db BLOCKCHAIN_MINER=[GENESIS_MINER] node miner.js
```

## Create other miners ()
```
NODE_ID=3001 DB_PATH=./db node app.js createWallet [ MINER_1=>result of create wallet ]
NODE_ID=3001 DB_PATH=./db BLOCKCHAIN_MINER=[MINER_1] node miner.js
```

## Move money
```
NODE_ID=3000 DB_PATH=./db BLOCKCHAIN_MINER=[GENESIS_MINER] node app.js add --from [BLOCKCHAIN_MINER] --to [MINER_1] --amount 0.01
NODE_ID=3000 DB_PATH=./db BLOCKCHAIN_MINER=[GENESIS_MINER] node app.js checkBalance --address [BLOCKCHAIN_MINER]
NODE_ID=3001 DB_PATH=./db BLOCKCHAIN_MINER=[MINER_1] node app.js checkBalance --address [MINER_1]
```
