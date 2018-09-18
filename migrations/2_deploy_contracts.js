/* global artifacts */
/* eslint-disable no-unused-vars */
const Wrapper = artifacts.require('./WrapEtheremon.sol');

module.exports = async (deployer, network, accounts) => {
  let KyberNetwork;

  if (network === 'ropsten') {
    KyberNetwork = '0x91a502C678605fbCe581eae053319747482276b9';
  } else if (network === 'rinkeby') {
    KyberNetwork = '0x4C095FE33e0D3873CA09CD00a13A131F182ba4ed';
  } else if (network === 'mainnet') {
    KyberNetwork = '0x91a502C678605fbCe581eae053319747482276b9';
  }

  await deployer.deploy(Wrapper, KyberNetwork);
};
