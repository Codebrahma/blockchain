#  CB Chain
A blockchain built from scratch for learning purpose

Every terminal needs to have NODE_ID, DB_PATH, BLOCKCHAIN_MINER set
```
node app.js createWallet
node app.js initChain --minerAddress [BLOCKCHAIN_MINER]
node app.js balance --address [BLOCKCHAIN_MINER] #should be 10
node miner.js
#In another terminal with the same environment variable
node app.js add --from [BLOCKCHAIN_MINER] --to [MINER 2] --amount 0.01
```

For another node, open another terminal and set NODE_ID=a different one