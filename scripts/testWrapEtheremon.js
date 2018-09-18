/* global artifacts, web3 */
/* eslint-disable no-underscore-dangle, no-unused-vars */
const BN = require('bn.js');
const moment = require('moment');

const NetworkProxy = artifacts.require('KyberNetworkProxy.sol');
const KNC = artifacts.require('KyberNetworkCrystal.sol');
const Wrapper = artifacts.require('WrapEtheremon.sol');
const Etheremon = artifacts.require('MockEtheremonExternalPayment');

function stdlog(input) {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${input}`);
}

function tx(result, call) {
  const logs = (result.logs.length > 0) ? result.logs[0] : { address: null, event: null };

  console.log();
  console.log(`   ${call}`);
  console.log('   ------------------------');
  console.log(`   > transaction hash: ${result.tx}`);
  console.log(`   > contract address: ${logs.address}`);
  console.log(`   > gas used: ${result.receipt.gasUsed}`);
  console.log(`   > event: ${logs.event}`);
  console.log();
}

module.exports = async (callback) => {
  const accounts = web3.eth.accounts._provider.addresses;
  const userWallet = accounts[4];

  // Set the instances
  const NetworkProxyInstance = await NetworkProxy.at(NetworkProxy.address);
  const KNCInstance = await KNC.at(KNC.address);
  const WrapperInstance = await Wrapper.at(Wrapper.address);
  const EtheremonInstance = await Etheremon.at(Etheremon.address);

  stdlog('- START -');

  stdlog(`ETH balance of ${userWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(userWallet))}`);
  stdlog(`KNC balance of ${userWallet} = ${web3.utils.fromWei(await KNCInstance.balanceOf(userWallet))}`);
  console.log();

  // Approve the KyberNetwork contract to spend user's tokens
  await KNCInstance.approve(
    NetworkProxy.address,
    web3.utils.toWei(new BN(10000)),
    { from: userWallet },
  );

  const monsterPriceInETH = await WrapperInstance.getMonsterPriceInETH(
    Etheremon.address,
    3,
    { from: userWallet },
  );
  stdlog(`catchable = ${monsterPriceInETH.catchable}`);
  stdlog(`monsterPriceInETH = ${monsterPriceInETH.monsterInETH}`);

  const monsterRates = await WrapperInstance.getMonsterRates(
    NetworkProxy.address,
    KNC.address,
    monsterPriceInETH.monsterInETH,
    { from: userWallet },
  );
  stdlog(`expectedRate = ${monsterRates.expectedRate}`);
  stdlog(`slippageRate = ${monsterRates.slippageRate}`);

  const monsterPriceInTokens = await WrapperInstance.getMonsterPriceInTokens(
    KNC.address,
    monsterRates.expectedRate,
    monsterPriceInETH.monsterInETH,
    { from: userWallet },
  );
  stdlog(`monsterPriceInTokens = ${monsterPriceInTokens}`);

  const result = await WrapperInstance.catchMonster(
    NetworkProxy.address,
    Etheremon.address,
    3,
    'Test',
    monsterPriceInETH.monsterInETH,
    KNC.address,
    monsterPriceInTokens,
    monsterPriceInTokens,
    monsterRates.expectedRate,
    0,
    { from: userWallet },
  );
  tx(result, 'catchMonster()');

  console.log();
  stdlog(`ETH balance of ${userWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(userWallet))}`);
  stdlog(`KNC balance of ${userWallet} = ${web3.utils.fromWei(await KNCInstance.balanceOf(userWallet))}`);

  stdlog('- END -');
  callback();
};
