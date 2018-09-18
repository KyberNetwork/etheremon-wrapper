/* global artifacts, web3, contract, it, assert */
const BN = require('bn.js');
const fs = require('fs');

const Network = artifacts.require('./kyberContracts/KyberNetwork.sol');
const NetworkProxy = artifacts.require('./kyberContracts/KyberNetworkProxy.sol');
const ConversionRates = artifacts.require('./kyberContracts/ConversionRates.sol');
const SanityRates = artifacts.require('./kyberContracts/SanityRates.sol');
const Reserve = artifacts.require('./kyberContracts/KyberReserve.sol');
const FeeBurner = artifacts.require('./kyberContracts/FeeBurner.sol');
const WhiteList = artifacts.require('./kyberContracts/WhiteList.sol');
const ExpectedRate = artifacts.require('./kyberContracts/ExpectedRate.sol');
const KyberNetworkCrystal = artifacts.require('./mockTokens/KyberNetworkCrystal.sol');
const KyberGenesisToken = artifacts.require('./mockTokens/KyberGenesisToken.sol');
const WrapEtheremon = artifacts.require('./WrapEtheremon.sol');
const EtheremonWorldNFT = artifacts.require('./etheremonContracts/EtheremonWorldNFT.sol');
const EtheremonData = artifacts.require('./etheremonContracts/EtheremonData.sol');
const EtheremonMonsterToken = artifacts.require('./mockTokens/EtheremonMonsterToken.sol');
const TestToken = artifacts.require('./mockTokens/TestToken.sol');

const testConfig = JSON.parse(fs.readFileSync('./config/test.json', 'utf8'));

// Kyber
let network;
let networkProxy;
let conversionRates;
let sanityRates;
let reserve;
let feeBurner;
let whiteList;
let expectedRate;
let knc;
let kgt;

// Etheremon
let monNFT;
let monData;
let emona;

// Wrapper
let wrapper;

// Accounts
let admin;
let alerter;
let operator;
let moderator;
let userWallet;
let reserveWallet;
let taxWallet;

// Misc.
let result;
let tokens = [];
const tokenAddresses = [];

const errTypes = {
  revert: 'revert',
  outOfGas: 'out of gas',
  invalidJump: 'invalid JUMP',
  invalidOpcode: 'invalid opcode',
  stackOverflow: 'stack overflow',
  stackUnderflow: 'stack underflow',
  staticStateChange: 'static state change',
};

const tryCatch = async (promise, errType) => {
  const PREFIX = 'Returned error: VM Exception while processing transaction:';

  try {
    await promise;
    throw null;
  } catch (error) {
    assert(error, 'Expected an error but did not get one');
    assert(error.message.startsWith(`${PREFIX} ${errType}`), `Expected an error starting with '${PREFIX} ${errType}' but got '${error.message}' instead`);
  }
};

contract('WrapEtheremon', (accounts) => {
  it('should init globals.', async () => {
    admin = accounts[0];
    operator = accounts[1];
    alerter = accounts[2];
    moderator = accounts[3];
    userWallet = accounts[4];
    reserveWallet = accounts[5];
    taxWallet = accounts[6];
  });

  it('should init test tokens.', async () => {
    for (let i = 0; i < testConfig.numTokens; i += 1) {
      const token = TestToken.new(`Test${i}`, `TEST${i}`, 18);
      tokens.push(token);
    }

    tokens = await Promise.all(tokens);

    for (let i = 0; i < tokens.length; i += 1) {
      tokenAddresses.push(tokens[i].address);
    }

    assert.equal(tokens.length, testConfig.numTokens, 'Wrong number of tokens');
  });

  it('should init Kyber Network contracts.', async () => {
    // Deploy Kyber tokens
    knc = await KyberNetworkCrystal.new();
    kgt = await KyberGenesisToken.new();
    tokens.push(knc);
    tokenAddresses.push(knc.address);

    // Deploy contracts
    network = await Network.new(admin);
    networkProxy = await NetworkProxy.new(admin);
    conversionRates = await ConversionRates.new(admin);
    sanityRates = await SanityRates.new(admin);
    reserve = await Reserve.new(network.address, conversionRates.address, admin);
    feeBurner = await FeeBurner.new(admin, knc.address, network.address);
    whiteList = await WhiteList.new(admin, kgt.address);
    expectedRate = await ExpectedRate.new(network.address, admin);

    // Setup permissions
    await network.addOperator(operator);
    await conversionRates.addOperator(operator);
    await reserve.addOperator(operator);
    await reserve.addAlerter(alerter);
    await feeBurner.addOperator(operator);
    await whiteList.addOperator(operator);
    await expectedRate.addOperator(operator);
    await sanityRates.addOperator(operator);

    // Setup KyberNetworkProxy
    await networkProxy.setKyberNetworkContract(network.address);

    // Setup KyberReserve
    await reserve.setContracts(
      network.address,
      conversionRates.address,
      sanityRates.address,
    );
    await network.addReserve(reserve.address, true);
    for (let i = 0; i < tokens.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      await reserve.approveWithdrawAddress(tokens[i].address, reserveWallet, true);
      await network.listPairForReserve(
        reserve.address,
        tokens[i].address,
        true,
        true,
        true,
      );
      /* eslint-enable no-await-in-loop */
    }

    // Setup FeeBurner
    await feeBurner.setReserveData(
      reserve.address,
      testConfig.FeeBurner.reserveFees,
      reserveWallet,
    );
    await feeBurner.setKNCRate(testConfig.FeeBurner.kncRate);
    await feeBurner.setTaxInBps(testConfig.FeeBurner.taxFeesBPS);
    await feeBurner.setTaxWallet(taxWallet);
    await feeBurner.setWalletFees(
      eval(testConfig.feeSharingWallets.etheremon.wallet),
      testConfig.feeSharingWallets.etheremon.fees,
    );

    // Setup ExpectedRate
    await expectedRate.setWorstCaseRateFactor(
      testConfig.ExpectedRate.minExpectedRateSlippage,
      { from: operator },
    );
    await expectedRate.setQuantityFactor(
      testConfig.ExpectedRate.quantityFactor,
      { from: operator },
    );

    // Setup ConversionRates
    await conversionRates.setValidRateDurationInBlocks(
      testConfig.ConversionRates.validDurationBlock,
    );
    for (let i = 0; i < tokens.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      await conversionRates.addToken(tokens[i].address);
      await conversionRates.setTokenControlInfo(
        tokens[i].address,
        testConfig.TestToken.minimalRecordResolution,
        testConfig.TestToken.maxPerBlockImbalance,
        testConfig.TestToken.maxTotalImbalance,
      );
      await conversionRates.setQtyStepFunction(
        tokens[i].address,
        [0],
        [0],
        [0],
        [0],
        { from: operator },
      );
      await conversionRates.setImbalanceStepFunction(
        tokens[i].address,
        [0],
        [0],
        [0],
        [0],
        { from: operator },
      );
      await conversionRates.enableTokenTrade(tokens[i].address);
      /* eslint-enable no-await-in-loop */
    }
    await conversionRates.setReserveAddress(reserve.address);
    await conversionRates.setBaseRate(
      tokenAddresses,
      testConfig.ConversionRates.baseBuy,
      testConfig.ConversionRates.baseSell,
      testConfig.ConversionRates.bytes14,
      testConfig.ConversionRates.bytes14,
      1,
      [0, 0, 0],
      { from: operator },
    );

    // Setup SanityRates
    await sanityRates.setReasonableDiff(
      tokenAddresses,
      testConfig.SanityRates.reasonableDiffs,
    );
    await sanityRates.setSanityRates(
      tokenAddresses,
      testConfig.SanityRates.sanityRates,
      { from: operator },
    );

    // Setup WhiteList
    await whiteList.setSgdToEthRate(
      testConfig.WhiteList.sgdToETHRate,
      { from: operator },
    );
    await whiteList.setCategoryCap(
      testConfig.WhiteList.defaultCategory,
      testConfig.WhiteList.defaultCap,
      { from: operator },
    );

    // Setup KyberNetwork
    await network.setKyberProxy(networkProxy.address);
    await network.setFeeBurner(feeBurner.address);
    await network.setWhiteList(whiteList.address);
    await network.setExpectedRate(expectedRate.address);
    await network.setParams(
      testConfig.KyberNetwork.maxGasPrice,
      testConfig.KyberNetwork.negDiffInBPS,
    );
    await network.setEnable(true);

    // Transfer tokens and ETH to reserve
    const amount = (
      new BN(1000).mul(new BN(10).pow(new BN(18)))
    ).toString();
    for (let i = 0; i < tokens.length; i += 1) {
      tokens[i].transfer(reserve.address, amount);
    }
    await reserve.sendTransaction(
      { from: admin, value: web3.utils.toWei(new BN(5)) },
    );
  });

  it('should init Wrapper contract.', async () => {
    wrapper = await WrapEtheremon.new(network.address);
    wrapper.addOperator(operator);
  });

  it('should init Etheremon contracts.', async () => {
    // Deploy contracts
    monData = await EtheremonData.new();
    monNFT = await EtheremonWorldNFT.new();

    // Setup EtheremonData
    await monData.AddModerator(moderator);
    await monData.AddModerator(monNFT.address);
    for (let i = 0; i < testConfig.monsterIDs.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      await monData.setMonsterClass(
        testConfig.monsterIDs[i],
        testConfig.monsterRates[i],
        500000000000000,
        true,
        { from: moderator },
      );
      /* eslint-enable no-await-in-loop */
    }

    // Setup EtheremonWorldNFT
    await monNFT.setContract(monData.address, monNFT.address);
    await monNFT.setAddressWhitelist(wrapper.address, true);
  });

  it('Kyber should return correct KNC rates.', async () => {
    result = {};
    result = await networkProxy.getExpectedRate(
      testConfig.ETH_ADDRESS,
      knc.address,
      new BN(1000000000000000),
    );
    assert.equal(result.expectedRate, testConfig.kncRates.buy, 'Wrong expected rate');
  });

  it('Kyber should swap ETH to KNC.', async () => {
    result = await networkProxy.trade(
      testConfig.ETH_ADDRESS,
      web3.utils.toWei(new BN(1)),
      knc.address,
      userWallet,
      web3.utils.toWei(new BN(100000)),
      result.expectedRate,
      testConfig.walletID,
      {
        from: userWallet,
        value: web3.utils.toWei(new BN(1)),
      },
    );

    result = new BN(result.receipt.logs[0].data.slice(-18), 16);
    assert.equal(result.toString(), await knc.balanceOf(userWallet), 'Wrong KNC balance from swap');
  });

  it('Wrapper should revert on fallback function.', async () => {
    await tryCatch(
      wrapper.sendTransaction({
        from: userWallet,
        value: web3.utils.toWei(new BN(1)),
      }),
      errTypes.revert,
    );
  });

  it('Wrapper should return Etheremon catchable status and monster price in ETH', async () => {
    result = {};
    result.ethPrices = [];
    for (let i = 0; i < testConfig.monsterIDs.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      result.etheremon = await monNFT.getPrice(
        testConfig.monsterIDs[i],
      );
      result.wrapper = await wrapper.getMonsterPriceInETH(
        monNFT.address,
        testConfig.monsterIDs[i],
        0,
      );
      assert.equal(
        result.etheremon.catchable,
        result.wrapper.catchable,
        'Wrapper catchable differ from Etheremon',
      );
      assert.equal(
        result.etheremon.price.toString(),
        result.wrapper.monsterInETH.toString(),
        'Wrapper monster price differ from Etheremon',
      );
      result.ethPrices.push(result.wrapper.monsterInETH);
      /* eslint-enable no-await-in-loop */
    }
  });

  it('Wrapper should return Etheremon rates', async () => {
    result.rates = [];
    for (let i = 0; i < testConfig.monsterIDs.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      result.kyber = await networkProxy.getExpectedRate(
        knc.address,
        testConfig.ETH_ADDRESS,
        result.ethPrices[i],
      );
      result.wrapper.rates = await wrapper.getMonsterRates(
        networkProxy.address,
        knc.address,
        result.ethPrices[i],
      );
      assert.equal(
        result.kyber.expectedRate.toString(),
        result.wrapper.rates.expectedRate.toString(),
        'Wrapper expected rates differ from Kyber',
      );
      assert.equal(
        result.kyber.slippageRate.toString(),
        result.wrapper.rates.slippageRate.toString(),
        'Wrapper slippage rates differ from Kyber',
      );
      result.rates.push(result.wrapper.rates.slippageRate);
      /* eslint-enable no-await-in-loop */
    }
  });

  it('Wrapper should return Etheremon monster price in Tokens', async () => {
    result.calc = {};
    result.tokenPrices = [];
    for (let i = 0; i < testConfig.monsterIDs.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      result.calc.tokenPrice = new BN(
        result.ethPrices[i],
      ).mul(new BN(10).pow(new BN(18))).div(new BN(result.rates[i])).add(new BN(1));
      result.wrapper.tokenPrice = await wrapper.getMonsterPriceInTokens(
        knc.address,
        result.rates[i],
        result.ethPrices[i],
      );
      assert.equal(
        result.calc.tokenPrice.toString(),
        result.wrapper.tokenPrice.toString(),
        'Wrapper token prices differ from calculated',
      );
      result.tokenPrices.push(result.wrapper.tokenPrice);
      /* eslint-enable no-await-in-loop */
    }
  });

  it('Wrapper should catch Etheremon monster using Tokens', async () => {
    await knc.approve(
      wrapper.address,
      new BN(2).pow(new BN(255)),
      { from: userWallet },
    );
    result.catch = {};
    for (let i = 0; i < testConfig.monsterIDs.length; i += 1) {
      /* eslint-disable no-await-in-loop */
      result.catch = await wrapper.catchMonster(
        networkProxy.address,
        monNFT.address,
        testConfig.monsterIDs[i],
        `Test${i}`,
        knc.address,
        result.tokenPrices[i],
        result.ethPrices[i],
        result.rates[i],
        testConfig.walletID,
        {
          from: userWallet,
        },
      );
      assert.equal(
        result.catch,
        testConfig.monsterIDs[i],
        'Wrapper caught monster IDs differ from stored monster IDs',
      );
      /* eslint-enable no-await-in-loop */
    }
  });
});
