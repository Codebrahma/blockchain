'use strict'
const expect = require('chai').expect

const BlockChain = require('../model/blockchain.js');
const Wallet     = require('../model/wallet.js');

describe('BlockChain', () => {

  let u1 = new Wallet();
  let u2 = new Wallet();

  {
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
               .then(function(){ return bc._chain.$forEach() })
               .then(function(c){ expect(c.length).to.equal(1) });
    });

    it('should contain the coinbase transaction', () => {
      let cbtx = bc.newCoinbaseTx();
      return bc._chain.$fetchLast()
               .then(function(b){
                  let txs = b.getTransactions();
                  expect(txs.length).to.equal( 1 );
                  expect(txs[0].isEql(cbtx)).to.equal(true);
               });
    });
  });

  describe("$transaction", () => {
    it('should have 10 coins, initially', () => {
      return bc.$getBalance(u1.pubKey)
               .then(function(b){ expect(b).to.equal(bc.subsidy) });
    });

    it('should have valid blance in the end', () => {
      return bc.$addBlock({ from: u1.pubKey, to: u2.pubKey, amount: 0.001 })
               .then(function(){ return bc.$getBalance(u1.pubKey) })
               .then(function(b){ expect(b).to.equal(9.999) })
               .then(function(){ return bc.$getBalance(u2.pubKey) })
               .then(function(b){ expect(b).to.equal(0.001) });
    });
  });
});
