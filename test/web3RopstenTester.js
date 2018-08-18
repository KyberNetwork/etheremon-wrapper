const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"))
const BN = require('bignumber.js')
var assert = require('assert')

var SENDER_ADDRESS_PRIVATE_KEY = '0x481faef7c0d3af215d5bf5dd71b207e0b7bb9e40feea1a844f560244c25f6943'
let SENDER_ACCOUNT = web3.eth.accounts.privateKeyToAccount(SENDER_ADDRESS_PRIVATE_KEY)

var ERC20ABI = [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"supply","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"digits","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]
var EtheremonExternalPaymentABI = [{"constant":false,"inputs":[{"name":"_contract","type":"address"}],"name":"setDataContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_player","type":"address"},{"name":"_block","type":"uint256"},{"name":"_seed","type":"uint256"},{"name":"_count","type":"uint256"}],"name":"getRandom","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"dataContract","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"moderators","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_isMaintaining","type":"bool"}],"name":"UpdateMaintaining","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"STAT_MAX","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalModerators","outputs":[{"name":"","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_sendTo","type":"address"},{"name":"_amount","type":"uint256"}],"name":"withdrawEther","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_ratio","type":"uint16"}],"name":"setPriceIncreasingRatio","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newModerator","type":"address"}],"name":"AddModerator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_gapFactor","type":"uint256"}],"name":"setFactor","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_oldModerator","type":"address"}],"name":"RemoveModerator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_player","type":"address"},{"name":"_classId","type":"uint32"},{"name":"_name","type":"string"}],"name":"catchMonster","outputs":[{"name":"tokenId","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"gapFactor","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"STAT_COUNT","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_classId","type":"uint32"}],"name":"getPrice","outputs":[{"name":"catchable","type":"bool"},{"name":"price","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"priceIncreasingRatio","outputs":[{"name":"","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isMaintaining","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"ChangeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_tokenId","type":"uint256"}],"name":"Transfer","type":"event"}]
var KyberNetworkProxyABI = [{"constant":false,"inputs":[{"name":"alerter","type":"address"}],"name":"removeAlerter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"enabled","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"pendingAdmin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getOperators","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"srcAmount","type":"uint256"},{"name":"dest","type":"address"},{"name":"destAddress","type":"address"},{"name":"maxDestAmount","type":"uint256"},{"name":"minConversionRate","type":"uint256"},{"name":"walletId","type":"address"},{"name":"hint","type":"bytes"}],"name":"tradeWithHint","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"srcAmount","type":"uint256"},{"name":"minConversionRate","type":"uint256"}],"name":"swapTokenToEther","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"amount","type":"uint256"},{"name":"sendTo","type":"address"}],"name":"withdrawToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"maxGasPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newAlerter","type":"address"}],"name":"addAlerter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kyberNetworkContract","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"user","type":"address"}],"name":"getUserCapInWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"srcAmount","type":"uint256"},{"name":"dest","type":"address"},{"name":"minConversionRate","type":"uint256"}],"name":"swapTokenToToken","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newAdmin","type":"address"}],"name":"transferAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"claimAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"minConversionRate","type":"uint256"}],"name":"swapEtherToToken","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"newAdmin","type":"address"}],"name":"transferAdminQuickly","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getAlerters","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"src","type":"address"},{"name":"dest","type":"address"},{"name":"srcQty","type":"uint256"}],"name":"getExpectedRate","outputs":[{"name":"expectedRate","type":"uint256"},{"name":"slippageRate","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"user","type":"address"},{"name":"token","type":"address"}],"name":"getUserCapInTokenWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOperator","type":"address"}],"name":"addOperator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_kyberNetworkContract","type":"address"}],"name":"setKyberNetworkContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"operator","type":"address"}],"name":"removeOperator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"field","type":"bytes32"}],"name":"info","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"srcAmount","type":"uint256"},{"name":"dest","type":"address"},{"name":"destAddress","type":"address"},{"name":"maxDestAmount","type":"uint256"},{"name":"minConversionRate","type":"uint256"},{"name":"walletId","type":"address"}],"name":"trade","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"},{"name":"sendTo","type":"address"}],"name":"withdrawEther","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"token","type":"address"},{"name":"user","type":"address"}],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_admin","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"trader","type":"address"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"actualSrcAmount","type":"uint256"},{"indexed":false,"name":"actualDestAmount","type":"uint256"}],"name":"ExecuteTrade","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newNetworkContract","type":"address"},{"indexed":false,"name":"oldNetworkContract","type":"address"}],"name":"KyberNetworkSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"sendTo","type":"address"}],"name":"TokenWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"sendTo","type":"address"}],"name":"EtherWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"pendingAdmin","type":"address"}],"name":"TransferAdminPending","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAdmin","type":"address"},{"indexed":false,"name":"previousAdmin","type":"address"}],"name":"AdminClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAlerter","type":"address"},{"indexed":false,"name":"isAdd","type":"bool"}],"name":"AlerterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newOperator","type":"address"},{"indexed":false,"name":"isAdd","type":"bool"}],"name":"OperatorAdded","type":"event"}]
var WrapEtheremonABI = [{"constant":true,"inputs":[{"name":"_kyber","type":"address"},{"name":"token","type":"address"},{"name":"monsterInETH","type":"uint256"}],"name":"getMonsterRates","outputs":[{"name":"expectedRate","type":"uint256"},{"name":"slippageRate","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"token","type":"address"},{"name":"expectedRate","type":"uint256"},{"name":"monsterInETH","type":"uint256"}],"name":"getMonsterPriceInTokens","outputs":[{"name":"monsterInTokens","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_etheremon","type":"address"},{"name":"_classId","type":"uint32"}],"name":"getMonsterPriceInETH","outputs":[{"name":"catchable","type":"bool"},{"name":"monsterInETH","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_kyber","type":"address"},{"name":"_etheremon","type":"address"},{"name":"_classId","type":"uint32"},{"name":"_name","type":"string"},{"name":"token","type":"address"},{"name":"tokenQty","type":"uint256"},{"name":"maxDestQty","type":"uint256"},{"name":"minRate","type":"uint256"},{"name":"walletId","type":"address"}],"name":"catchMonster","outputs":[{"name":"monsterId","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"token","type":"address"},{"name":"user","type":"address"}],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"balanceBefore","type":"uint256"},{"indexed":false,"name":"balanceAfter","type":"uint256"},{"indexed":false,"name":"change","type":"uint256"}],"name":"SwapTokenChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"EtherChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"monsterId","type":"uint256"},{"indexed":false,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"CaughtWithToken","type":"event"}]

const EtheremonExternalPaymentAddress = "0x11f9f4ce02f3a4e2ae37f8dedf23e882fd67b2c0";
const KyberNetworkProxyAddress = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755";
const WrapEtheremonAddress = "0xA87DC865F5A3Ffb01d6dac99E2064e580dcD5b3F";
const KNCAddress = "0x4E470dc7321E84CA96FcAEDD0C8aBCebbAEB68C6"
var KNCTokenContract = new web3.eth.Contract(ERC20ABI, KNCAddress)
var EtheremonExternalPaymentContract = new web3.eth.Contract(EtheremonExternalPaymentABI, EtheremonExternalPaymentAddress)
var KyberNetworkProxyContract = new web3.eth.Contract(KyberNetworkProxyABI, KyberNetworkProxyAddress)
var WrapEtheremonContract = new web3.eth.Contract(WrapEtheremonABI, WrapEtheremonAddress)

async function main() {
  	await fallbackFunctionShouldReturnETH()
  	await verifyMonsterPrice()
  	await catchMonster()
}

async function fallbackFunctionShouldReturnETH() {
	try {
		startBalance = await web3.eth.getBalance(SENDER_ACCOUNT.address)
    trfAmount = web3.utils.toWei('0.05')
    txHash = broadcastTx(WrapEtheremonAddress, 0, trfAmount)
    endBalance = await web3.eth.getBalance(SENDER_ACCOUNT.address)
    	assert(startBalance-endBalance < trfAmount, "Fallback function did not return ETH")
  	} catch(e) {
  	console.log(e)
  	}
}

async function verifyMonsterPrice() {
	try {
		classID = 109
		result = await WrapEtheremonContract.methods.getMonsterPriceInETH(EtheremonExternalPaymentAddress, classID).call()
		assert(result.catchable,"Monster not catchable")
		assert(result.monsterInETH!=0,"Returned price was 0 ETH")

		monsterInETH = result.monsterInETH
		tokenAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
		result = await WrapEtheremonContract.methods.getMonsterRates(KyberNetworkProxyAddress, tokenAddress, monsterInETH).call()
		assert.equal(web3.utils.fromWei(result.expectedRate),"1","Expected rate of ETH <-> ETH not 1-1")

		result = await WrapEtheremonContract.methods.getMonsterRates(KyberNetworkProxyAddress, KNCAddress, monsterInETH).call()
		assert.notEqual(web3.utils.fromWei(result.expectedRate),"0","Returned expected ETH <-> KNC rate was zero")

		expectedRate = result.expectedRate
		result = await WrapEtheremonContract.methods.getMonsterPriceInTokens(KNCAddress,expectedRate,monsterInETH).call()
		expectedMonsterInTokens = convertToTokenPrice(monsterInETH,expectedRate)
		acutalMonsterInTokens = result
		console.log(expectedMonsterInTokens)
		console.log(acutalMonsterInTokens)
		assert(Math.abs(expectedMonsterInTokens-acutalMonsterInTokens)<=1,"Monster in tokens price incorrect")
	} catch(e) {
  	console.log(e)
  	}
}

function convertToTokenPrice(monsterInETH,expectedRate) {
	monsterInETH = new BN(monsterInETH).times(10**18)
	monsterInETH = monsterInETH.div(expectedRate)
	monsterInETH = monsterInETH.integerValue()
	return monsterInETH
}

async function catchMonster() {
  try {
    //approve WrapEtheremon to swap KNC
    /*
    txData = await KNCTokenContract.methods.approve(
      WrapEtheremonAddress,
      '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    ).encodeABI()
    txHash = await broadcastTx(KNCAddress,txData,0)
    console.log(txHash)
    */
    classID = 109
    result = await WrapEtheremonContract.methods.getMonsterPriceInETH(EtheremonExternalPaymentAddress, classID).call()
    maxDestQty = result.monsterInETH
    result = await WrapEtheremonContract.methods.getMonsterRates(KyberNetworkProxyAddress, KNCAddress, maxDestQty).call()
		minRate = result.slippageRate
    expectedRate = result.expectedRate
    tokenQty = await WrapEtheremonContract.methods.getMonsterPriceInTokens(KNCAddress,expectedRate,maxDestQty).call()
    tokenQty = (parseInt(tokenQty) + 0.001*10**18).toString()
    console.log("destQty: " + maxDestQty)
    console.log("minRate: " + minRate)
    console.log("tokenQty: "+tokenQty)

    txData = await WrapEtheremonContract.methods.catchMonster(
      KyberNetworkProxyAddress,
      EtheremonExternalPaymentAddress,
      classID,
      "Anton", //_name
      KNCAddress,
      tokenQty,
      maxDestQty,
      minRate,
      0
    ).encodeABI()

    txHash = await broadcastTx(WrapEtheremonAddress,txData,0)
    console.log(txHash)
  } catch(e) {
    console.log(e)
  }
}

async function broadcastTx(toAddress, txData, value) {
   const tx = {
       from : SENDER_ACCOUNT.address,
       to : toAddress,
       data : txData,
       gas : 1000000,
       value: value,
       chainId : await web3.eth.net.getId(),
       gasPrice : new BN(10).times(10 ** 9)
   }

   const signedTx = await web3.eth.accounts.signTransaction(tx, SENDER_ACCOUNT.privateKey)
   txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
   return txHash
}

main()
