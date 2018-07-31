pragma solidity ^0.4.24;

import "./KyberNetworkProxy.sol";
import "./EtheremonExternalPayment.sol";

contract WrapEtheremon is BasicAccessControl, Utils2 {
  event SwapTokenChange(uint balanceBefore, uint balanceAfter, uint change);
  event EtherChange(address indexed sender, uint amount);

  address public walletId = address(0x0);
  ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

  /// @dev Contract contstructor
  constructor () public { }

  /// @dev Return the ETH to user that was taken back by the network
  function() public payable {
    msg.sender.transfer(msg.value);
    emit EtherChange(msg.sender, msg.value);
  }

  /// @dev Set Etheremon's referral wallet ID where referral fees will be sent to
  /// @param _walletId Wallet ID of Etheremon
  function setWalletId(address _walletId) public onlyModerators {
    walletId = _walletId;
  }

  /// @dev Get the token price equivalent of the Etheremon monster
  /// @param _kyberAddress KyberNetworkProxyInterface address
  /// @param _etheremonAddress EtheremonExternalPayment address
  /// @param token ERC20 token address
  /// @param _classId Class ID of monster
  /// @return expectedRate, slippageRate, tokenPrice
  function getMonsterPriceInTokens(
    KyberNetworkProxyInterface _kyberAddress,
    EtheremonExternalPayment _etheremonAddress,
    ERC20 token,
    uint32 _classId
  )
    public
    view
    returns (
      uint expectedRate,
      uint slippageRate,
      uint tokenPrice
    ) {
    bool catchable;
    uint ethValue;

    (catchable, ethValue) = _etheremonAddress.getPrice(_classId);
    (expectedRate, slippageRate) = _kyberAddress.getExpectedRate(ETH_TOKEN_ADDRESS, token, ethValue);
    tokenPrice = calcDestAmount(ETH_TOKEN_ADDRESS, token, ethValue, expectedRate);
  }

  /// @dev Acquires the monster from Etheremon
  /// @param _kyberAddress KyberNetworkProxyInterface address
  /// @param _etheremonAddress EtheremonExternalPayment address
  /// @param _player Address of the player
  /// @param _classId Class ID of monster
  /// @param _name Name of the monster
  /// @param token ERC20 token address
  /// @param tokenQty Amount of tokens required to acquire the monster
  /// @param maxDestQty Limit on the amount of destination tokens
  /// @param minRate Minimum conversion rate
  /// @return monsterId
  function catchMonster(
    KyberNetworkProxyInterface _kyberAddress,
    EtheremonExternalPayment _etheremonAddress,
    address _player,
    uint32 _classId,
    string _name,
    ERC20 token,
    uint tokenQty,
    uint maxDestQty,
    uint minRate
  )
    public
    returns (
      uint monsterId
    ) {
    uint tokenPrice;

    // Get the starting token balance of the players wallet
    uint startTokenBalance = token.balanceOf(this);

    // Check that the player has transferred the token to this contract,
    // then approve the Kyber contract to trade this token
    require(token.transferFrom(_player, this, tokenQty));
    token.approve(address(_kyberAddress), tokenQty);

    // Get the current price of the monster
    (,tokenPrice) = getTokenPrice(_kyberAddress, _etheremonAddress, token, _classId);

    // Swap player's token to ETH to send to Etheremon payments contract
    uint destAmount = _kyberAddress.tradeWithHint(token, tokenQty, ETH_TOKEN_ADDRESS, address(this), maxDestQty, minRate, walletId, "");

    // Check that destAmount >= tokenPrice
    require(destAmount >= tokenPrice);

    // Acquire the monster and send to player
    monsterId = _etheremonAddress.catchMonster.value(destAmount)(_player, _classId, _name);

    // Calculate change of player
    uint change = token.balanceOf(this) - startTokenBalance;

    // Log the exchange event
    emit SwapTokenChange(startTokenBalance, token.balanceOf(this), change);

    // Transfer change back to player
    token.transfer(_player, change);

    return monsterId;
  }
}
