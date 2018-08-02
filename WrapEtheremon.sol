pragma solidity ^0.4.24;

import "./KyberNetworkProxyInterface.sol";
import "./EtheremonExternalPayment.sol";
import "./Utils2.sol";

contract WrapEtheremon is Utils2 {
    event SwapTokenChange(uint balanceBefore, uint balanceAfter, uint change);
    event EtherChange(address indexed sender, uint amount);

    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /// @dev Contract contstructor
    constructor () public { }

    /// @dev Return the ETH to user that was taken back by the network
    function() public payable {
        msg.sender.transfer(msg.value);
        emit EtherChange(msg.sender, msg.value);
    }

    /// @dev Get the token price equivalent of the Etheremon monster
    /// @param _kyber KyberNetworkProxyInterface address
    /// @param _etheremon EtheremonExternalPayment address
    /// @param token ERC20 token address
    /// @param _classId Class ID of monster
    /// @return expectedRate, slippageRate, tokenPrice
    function getMonsterPriceInTokens(
        KyberNetworkProxyInterface _kyber,
        EtheremonExternalPayment _etheremon,
        ERC20 token,
        uint32 _classId
    )
        public
        view
        returns (
          uint expectedRate,
          uint slippageRate,
          uint tokenPrice
        )
    {
        bool catchable;
        uint ethValue;

        (catchable, ethValue) = _etheremon.getPrice(_classId);
        (expectedRate, slippageRate) = _kyber.getExpectedRate(ETH_TOKEN_ADDRESS, token, ethValue);
        tokenPrice = calcDestAmount(ETH_TOKEN_ADDRESS, token, ethValue, expectedRate);

        return (expectedRate, slippageRate, tokenPrice);
    }

    /// @dev Acquires the monster from Etheremon using tokens
    /// @param _kyber KyberNetworkProxyInterface address
    /// @param _etheremon EtheremonExternalPayment address
    /// @param _classId Class ID of monster
    /// @param _name Name of the monster
    /// @param token ERC20 token address
    /// @param tokenQty Amount of tokens required to acquire the monster
    /// @param maxDestQty Limit on the amount of destination tokens
    /// @param minRate Minimum conversion rate
    /// @param walletId Wallet ID where Kyber referral fees will be sent to
    /// @return monsterId
    function catchMonster(
        KyberNetworkProxyInterface _kyber,
        EtheremonExternalPayment _etheremon,
        uint32 _classId,
        string _name,
        ERC20 token,
        uint tokenQty,
        uint maxDestQty,
        uint minRate,
        address walletId
    )
        public
        returns (uint monsterId)
    {
        address kyberAddress = address(_kyber);
        uint tokenPrice;

        // Get the starting token balance of the player's wallet
        uint startTokenBalance = token.balanceOf(this);

        // Check that the player has transferred the token to this contract
        require(token.transferFrom(msg.sender, this, tokenQty));

        // Mitigate ERC20 Approve front-running attack, by initially setting
        // allowance to 0
        token.approve(kyberAddress, 0);

        // Verify that the token balance has not decreased from front-running
        require(token.balanceOf(this) == startTokenBalance);

        // Once verified, set the token allowance to tokenQty
        token.approve(kyberAddress, tokenQty);

        // Get the current price of the monster
        (,tokenPrice) = getMonsterPriceInTokens(_kyber, _etheremon, token, _classId);

        // Swap player's token to ETH to send to Etheremon payments contract
        uint destAmount = _kyber.tradeWithHint(token, tokenQty, ETH_TOKEN_ADDRESS, address(this), maxDestQty, minRate, walletId, "");

        // Check that destAmount >= tokenPrice
        require(destAmount >= tokenPrice);

        // Acquire the monster and send to player
        monsterId = _etheremon.catchMonster.value(destAmount)(msg.sender, _classId, _name);

        // Return change to player if any
        calcPlayerChange(token, startTokenBalance);

        return monsterId;
    }

    /// @dev Calculates token change and returns to player
    /// @param token ERC20 token address
    /// @param startTokenBalance Starting token balance of the player's wallet
    function calcPlayerChange(ERC20 token, uint startTokenBalance) private {
        // Calculate change of player
        uint change = token.balanceOf(this) - startTokenBalance;

        // Log the exchange event
        emit SwapTokenChange(startTokenBalance, token.balanceOf(this), change);

        // Transfer change back to player
        token.transfer(msg.sender, change);
    }
}
