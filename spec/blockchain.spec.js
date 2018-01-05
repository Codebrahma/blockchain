'use strict'
const expect = require('chai').expect

const BlockChain = require('../model/blockchain.js');
const Wallet     = require('../model/wallet.js');
const Transaction= require('../model/Transaction.js').Transaction;

describe('BlockChain', () => {

  let u1 = new Wallet();
  let u2 = new Wallet();

  {
    process.env.SUBSIDY          = 5;
    process.env.BLOCK_DIFFICULTY = 2;
    process.env.BLOCKCHAIN_MINER = u1.pubKey;
  };

  let bc = new BlockChain();


  describe("createWallet", () => {
    it('should generate and store public and private keys', () => {
      return u1.$init()
               .then(function(){ u2.$init() })
               .then(function(){
                  expect(u1.pubKey).to.exist;
                  expect(u1.privateKey).to.exist;
                  expect(u2.pubKey).to.exist;
                  expect(u2.privateKey).to.exist;
                  return Wallet.$fetch(u1.pubKey);
               })
               .then(function(w){
                  expect(w.pubKey).to.equal(u1.pubKey);
                  expect(w.privateKey).to.equal(u1.privateKey);
               });
    });
  });

  describe("$init", () => {
    it('should initialize an empty blockchain', () => {
      return bc._chain.$isEmpty().then(function(isEmpty){
        expect(isEmpty).to.eql(true);
      });
    });

    it('should create gensis block and append to the blockchian', () => {
      return bc.$init()
               .then(function(){ return bc._chain.$reduce( (b,x) => x+1, 0) })
               .then(function(c){ expect(c).to.equal(1) });
    });

    it('should contain the coinbase transaction', () => {
      let cbtx = Transaction.newCoinbaseTx();
      return bc._chain.$fetchLast()
               .then(function(b){
                  let txs = b.getTransactions();
                  expect(txs.length).to.equal( 1 );
                  expect(txs[0].isEql(cbtx)).to.equal(true);
               });
    });
  });

  describe("$transaction", () => {
    it('should have 5 coins, initially', () => {
      return bc.$getBalance(u1.pubKey)
               .then(function(b){ expect(b).to.equal(5) });
    });

    it('should have valid balance if transaction is valid', () => {
      return bc.$addBlock({ from: u1.pubKey, to: u2.pubKey, amount: 0.001 }, u1.privateKey)
               .then(function(){ return bc.$getBalance(u1.pubKey) })
               .then(function(b){ expect(b).to.equal(5 - 0.001 + 5) })
               .then(function(){ return bc.$getBalance(u2.pubKey) })
               .then(function(b){ expect(b).to.equal(0.001) });
    });

    it('should throw error if wrong privKey', () => {
      return bc.$addBlock({ from: u1.pubKey, to: u2.pubKey, amount: 0.001 }, u1.privateKey+"*")
               .then(function(){ return bc.$getBalance(u1.pubKey) })
               .catch(function(b){ expect(b).to.eq('signature mismatch')       })
    });

    it('should throw error if wrong sender pubKey', () => {
      return bc.$addBlock({ from: u1.pubKey+"a", to: u2.pubKey, amount: 0.001 }, u1.privateKey)
               .then(function(){ return bc.$getBalance(u1.pubKey) })
               .catch(function(b){ expect(b).to.eq('Not enough funds')       })
    });
  });
});
