pragma solidity ^0.4.23;

import "./KyberNetworkProxy.sol";
import "./EtheremonExternalPayment.sol";

contract WrapEtheremon is BasicAccessControl, Utils2 {
    KyberNetworkProxyInterface public kyber;
    EtheremonExternalPayment public etheremon;
    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /// @dev Contract contstructor
    /// @param KyberNetworkProxy contract address
    /// @param EtheremonExternalPayment contract address
    constructor (address _kyberAddress,address _etheremonExternalPaymentAddress) {
      kyber = KyberNetworkProxyInterface(_kyberAddress);
      etheremon = EtheremonExternalPayment(_etheremonExternalPaymentAddress);
    }

    /// @notice Can only be called by whitelisted moderators
    /// @dev Sets the KyberNetworkProxy address
    /// @param KyberNetwork contract address
    function setKyberAddress(address _kyberAddress) onlyModerators {
      kyber = KyberNetworkProxyInterface(_kyberAddress);
    }

    /// @notice Can only be called by whitelisted moderators
    /// @dev sets the EtheremonExternalPayment address
    /// @param EtheremonExternalPayment contract address
    function setEtheremonAddress(address _etheremonExternalPaymentAddress) onlyModerators {
        etheremon = EtheremonExternalPayment(_etheremonExternalPaymentAddress);
    }

    /// @dev Gets the equivalent token price of the Etheremon monster
    /// @param ERC20 token address
    /// @param classId of the monaster
    /// @return expectedRate, slippageRate, tokenAmount
    function getTokenPrice(
      ERC20 token,
      uint32 _classId
    )
      public
      constant
      returns (
        uint expectedRate,
        uint slippageRate,
        uint tokenAmount
      ) {
      bool catchable;
      uint ethValue;

      (catchable, ethValue) = etheremon.getPrice(_classId);
      (expectedRate, slippageRate) = kyber.getExpectedRate(ETH_TOKEN_ADDRESS, token, ethValue);
      tokenAmount = calcDestAmount(ETH_TOKEN_ADDRESS, token,ethValue, expectedRate);
    }

    event SwapTokenChange(uint balanceBefore, uint balanceAfter, uint change);

    /// @dev Acquires the monster from Etheremon
    /// @param address of the user/player
    /// @param classId of the monster
    /// @param custom name of the monster
    /// @param ERC20 token address
    /// @param amount of ERC20 tokens to acquire the monster
    /// @param limit on the amount of ETH to pay to Etheremon contracts
    /// @param minimum converstion rate from ERC20 token to ETH
    /// @param referral wallet address of Etheremon to receive part of the fees
    /// @return expectedRate, slippageRate, tokenAmount
    function catchMonster(
      address _player,
      uint32 _classId,
      string _name,
      ERC20 token,
      uint tokenQty,
      uint maxDestQty,
      uint minRate,
      address walletId
    )
      public
      payable
      returns (
        uint tokenId
      ) {
      // Get the starting token balance of the players wallet
      uint startTokenBalance = token.balanceOf(this);

      // Check that the player/user has transferred the token to this contract,
      // then approve the Kyber contract to trade this token
      require(token.transferFrom(_player, this, tokenQty));
      token.approve(address(kyber), tokenQty);

      // Calculate the ETH amount to send to Etheremon payments contract
      uint destAmount = kyber.tradeWithHint(token, tokenQty, ETH_TOKEN_ADDRESS, address(this), maxDestQty, minRate, walletId, "");

      // Acquire the monster and send to player/user
      etheremon.catchMonster.value(destAmount)(_player, _classId, _name);

      // Calculate change of user
      uint change = token.balanceOf(this) - startTokenBalance;

      // Log the exchange event
      emit SwapTokenChange(startTokenBalance, token.balanceOf(this), change);

      // Transfer change back to user
      token.transfer(_player, change);
    }
}
