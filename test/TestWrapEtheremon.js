const WrapEtheremon = artifacts.require('./WrapEtheremon.sol')
const KyberNetworkProxy = artifacts.require('./kyberContracts/KyberNetworkProxyInterface.sol');
const EtheremonExternalPayment = artifacts.require('./etheremonContracts/EtheremonExternalPayment.sol');
const Utils2 = artifacts.require('./kyberContracts/Utils2.sol');
const TestToken = artifacts.require('./mockContracts/TestToken.sol');
const Helper = require('./Helper.js');
const BigNumber = require('bignumber.js');

const ETH_ADDRESS = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const GAS_PRICE = new BigNumber(10).pow(9).times(50); // 50 Gwei
const NUM_TOKENS = 2;
const MONSTER_CLASSID = [106, 108, 109];
const PRECISION = new BigNumber(10).pow(18);
const WALLET_ID = '0x0000000000000000000000000000000000000000';

let admin;
let etheremon;
let kyber;
let operator;
let tokens = [];
let user;
let utils;
let wrapper;

let catchable = { etheremon: {}, wrapper: {} };
let monsterInETH = { etheremon: {}, wrapper: {} };
let monsterInTokens = { kyber: {}, wrapper: {} };
let expectedRate = { kyber: {}, wrapper: {} };
let slippageRate = { kyber: {}, wrapper: {} };

contract('WrapEtheremon', function(accounts) {
  beforeEach('setup contract for each test', async function () {
    kyber = await KyberNetworkProxy.new(admin);
    utils = await Utils2.new();
    etheremon = await EtheremonExternalPayment.new();
    wrapper = await WrapEtheremon.new(kyber, { from: admin });
    await WrapEtheremon.addOperator(operator);

    for (let i = 0; i < MONSTER_CLASSID.length - 1; i++) {
      catchable['etheremon'][MONSTER_CLASSID[i]] = [];
      catchable['wrapper'][MONSTER_CLASSID[i]] = [];
      monsterInETH['etheremon'][MONSTER_CLASSID[i]] = [];
      monsterInETH['wrapper'][MONSTER_CLASSID[i]] = [];
      monsterInTokens['kyber'][MONSTER_CLASSID[i]] = [];
      monsterInTokens['wrapper'][MONSTER_CLASSID[i]] = [];
      expectedRate['kyber'][MONSTER_CLASSID[i]] = [];
      expectedRate['wrapper'][MONSTER_CLASSID[i]] = [];
      slippageRate['kyber'][MONSTER_CLASSID[i]] = [];
      slippageRate['wrapper'][MONSTER_CLASSID[i]] = [];
    }
  });

  it('should init globals and tokens.', async function () {
    admin = accounts[0];
    operator = accounts[1];
    user =  accounts[2];

    for (let i = 0; i < NUM_TOKENS; i++) {
      let token = TestToken.new(`Test${i}`, `TST${i}`, 18);
      tokens.push(token);
    }

    assert.equal(tokens.length, NUM_TOKENS, 'Wrong number of tokens');
  });

  it('should return ETH on fallback function.', async function () {
    await wrapper.sendTransaction({
      value: new BigNumber(10).pow(18),
      from: user,
      gas: 20000,
      gasPrice: GAS_PRICE,
    })

    let success = await wrapper.success.call();
    assert.equal(success, 0, 'Fallback function failed');
  });

  it('should return catchable Etheremon and monster price in ETH', async function () {
    for (let i = 0; i < MONSTER_CLASSID.length - 1; i++) {
      let [eCatchable, eMonsterInETH] = await etheremon.getPrice(
        MONSTER_CLASSID[i],
      );

      let [wCatchable, wMonsterInETH] = await wrapper.getMonsterPriceInETH(
        etheremon.address,
        MONSTER_CLASSID[i],
      );

      catchable['etheremon'][MONSTER_CLASSID[i]].push(eCatchable);
      catchable['wrapper'][MONSTER_CLASSID[i]].push(wCatchable);
      monsterInETH['etheremon'][MONSTER_CLASSID[i]].push(eMonsterInETH);
      monsterInETH['wrapper'][MONSTER_CLASSID[i]].push(wMonsterInETH);

      assert.equal(eCatchable, wCatchable, 'Returned catchable not matching');
      assert.equal(eMonsterInETH, wMonsterInETH, 'Returned monsterInETH not matching');
    }
  });

  it('should return Etheremon monster rates', async function () {
    for (let i = 0; i < MONSTER_CLASSID.length - 1; i++) {
      for (let j = 0; j < NUM_TOKENS; j++) {
        let [kExpectedRate, kSlippageRate] = await kyber.getExpectedRate(
          tokens[j].address,
          ETH_ADDRESS,
          monsterInETH['wrapper'][MONSTER_CLASSID[i]],
        );

        let [wExpectedRate, wSlippageRate] = await wrapper.getMonsterRates(
          kyber.address,
          tokens[j].address,
          monsterInETH['wrapper'][MONSTER_CLASSID[i]],
        );

        expectedRate['kyber'][MONSTER_CLASSID[i]].push(kExpectedRate);
        expectedRate['wrapper'][MONSTER_CLASSID[i]].push(wExpectedRate);
        slippageRate['kyber'][MONSTER_CLASSID[i]].push(kSlippageRate);
        slippageRate['wrapper'][MONSTER_CLASSID[i]].push(wSlippageRate);

        assert.equal(kExpectedRate.valueOf(), wExpectedRate.valueOf(), 'Returned expectedRate not matching');
        assert.equal(kSlippageRate.valueOf(), kSlippageRate.valueOf(), 'Returned slippageRate not mathcing');
      }
    }
  });

  it('should return Etheremon monster price in tokens', async function () {
    for (let i = 0; i < MONSTER_CLASSID.length - 1; i++) {
      for (let j = 0; j < NUM_TOKENS; j++) {
        let kMonsterInTokens = await utils.calcSrcAmount(
          ETH_ADDRESS,
          tokens[j].address,
          monsterInETH['wrapper'][MONSTER_CLASSID[i]],
          expectedRate['wrapper'][MONSTER_CLASSID[i]],
        );

        let wMonsterInTokens = await wrapper.getMonsterPriceInTokens(
          kyber.address,
          tokens[j].address,
          monsterInETH['wrapper'][MONSTER_CLASSID[i]],
        );

        monsterInTokens['kyber'][MONSTER_CLASSID[i]].push(kMonsterInTokens);
        monsterInTokens['wrapper'][MONSTER_CLASSID[i]].push(wMonsterInTokens);

        assert.equal(kMonsterInTokens, wMonsterInTokens, 'Returned monsterInTokens not matching');
      }
    }
  });

  it('should catch the Etheremon monster and return to user', async function () {
    for (let i = 0; i < MONSTER_CLASSID.length - 1; i++) {
      let name = `Truffle Test ${i}`;

      let eMonsterId = await etheremon.catchMonster(
        user,
        MONSTER_CLASSID[i],
        name,
        { from: user,
          value: monsterInETH['wrapper']MONSTER_CLASSID[i]},
        },
      );

      for (let j = 0; j < NUM_TOKENS; j++) {
        let wMonsterId = await wrapper.catchMonster(
          kyber.address,
          etheremon.address,
          MONSTER_CLASSID[i],
          name,
          tokens[j].address,
          monsterInTokens['wrapper'][MONSTER_CLASSID[i]],
          monsterInTokens['wrapper'][MONSTER_CLASSID[i]] * slippageRate['wrapper'][MONSTER_CLASSID[i]],
          expectedRate['wrapper'][MONSTER_CLASSID[i]],
          WALLET_ID,
          { from: user },
        );

        assert.equal(eMonsterId, wMonsterId, 'Returned monsterId not matching');
      }
    }
  });
});
