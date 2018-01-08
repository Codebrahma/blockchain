# Blockchain

A simple blockchain transaction network implementation with node-js

The genesis block is associated with {0404b567f7216b4acb73d7f37bbaff70fd7e46ec772216d26cee262c212c86059587a373b0b8cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629, 87d672b4f7172654c6ebe2bd997ab18097ffc8db230bddd80995fd9fca9540b2}

### Blockchain network
The nmap service keeps track of active miners.
```
node nmap.js
```

### Miner
To start mining transactions run `node miner.js`, with the BLOCKCHAIN_MINER environment variable pointing to the reward account's private key.

```
 BLOCKCHAIN_MINER=0404b567f7216b4acb73d7f37bbaff70fd7e46ec772216d26cee262c212c86059587a373b0b8cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629 node miner.js
```

### Bank
Bank JS acts as an API layer onto of the block chain to transact, view balances etc.

```
 NODE_PORT=8081 node bank.js

### Create Wallet
curl -XPOST http://localhost:8080/api/createWallet

{"code":200,"message":"WALLET_CREATED","data":{"walletID":"04662c45a031dbf520b8498270ab0d0f686f64f8e2242597b298be0e75cddfba91c350fa4986d8fc2f4d397573b2041c2843cd7d2b687fb7170f72a6d0ac7aecc3"}}

curl -XPOST http://localhost:8080/api/send --data "from=0404b567f7216b4acb73d7f37bbaff70fd7e46ec772216d26cee262c212c86059587a373b0b8cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629&to=044cfc4453fa434dcb3b1e41b024d9b63b1215a3a21f170ce5f5fe946c6110cb51fa245d6b3338cb2e6e5cb5c04be2d128b7cf6f76ec06fcc6189caa022dcd25cd&amount=0.0001"

{"code":200,"message":"PROCESSING_TRANSACTION","data":{}}

curl http://localhost:8080/api/balance?from=0404b567f7216b4acb73d7f37bbaff70cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629
{"code":200,"message":"BALANCE","data":{"balance":0}}

 ```
