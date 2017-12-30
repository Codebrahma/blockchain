'use strict'
const expect = require('chai').expect

const BlockChain = require('../model/blockchain.js');

describe('BlockChain', () => {

  let bc = new BlockChain();
  
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
    let miner = "testminer";

    it('should have 10 coins, initially', () => {
      return bc.$getBalance(miner)
               .then(function(b){ expect(b).to.equal(bc.subsidy) });
    });

    it('should have valid blance in the end', () => {
      return bc.$addBlock({ from: miner, to: "tester", amount: 3 })
               .then(function(){ return bc.$getBalance(miner) })
               .then(function(b){ expect(b).to.equal(7) })
               .then(function(){ return bc.$getBalance("tester") })
               .then(function(b){ expect(b).to.equal(3) });
    });
  });

});