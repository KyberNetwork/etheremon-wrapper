pragma solidity ^0.4.24;

import "./WrapEtheremonInterface.sol";
import "./WrapEtheremonPermissions.sol";
import "./kyberContracts/Utils2.sol";


contract WrapEtheremon is WrapEtheremonInterface, WrapEtheremonPermissions, Utils2 {
    event SwapTokenChange(uint startTokenBalance, uint change);
    event CaughtWithToken(address indexed sender, uint monsterId, ERC20 token, uint amount);
    event ETHReceived(address indexed sender, uint amount);

    address public KyberNetwork;
    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /// @dev Contract contstructor
    /// @param _KyberNetwork KyberNetwork main contract address
    constructor (address _KyberNetwork) public {
        KyberNetwork = _KyberNetwork;
    }

    /// @dev Return the ETH to user that was taken back by the network
    function() public payable {
        // Only receive ETH from KyberNetwork main contract
        require(msg.sender == KyberNetwork);
        emit ETHReceived(msg.sender, msg.value);
    }

    /// @notice Can only be called by operators
    /// @dev Sets the KyberNetwork address
    /// @param _KyberNetwork KyberNetwork contract address
    function setKyberNetwork(address _KyberNetwork) public onlyOperator {
      KyberNetwork = _KyberNetwork;
    }

    /// @dev Get the ETH price of the Etheremon monster and if it is catchable
    /// @param _etheremon EtheremonWorldNFT address
    /// @param _classId Class ID of monster
    /// @param _payPrice Price of monster passed from Etheremon server
    /// @return catchable, monsterInETH
    function getMonsterPriceInETH(
        EtheremonWorldNFT _etheremon,
        uint32 _classId,
        uint _payPrice
    )
        public
        view
        returns (
            bool catchable,
            uint monsterInETH
        )
    {
        // Get monster details from Etheremon contract
        (catchable, monsterInETH) = _etheremon.getPrice(_classId);

        // Get the highest price from contract pricing or offchain pricing
        monsterInETH = max(monsterInETH, _payPrice);

        return (catchable, monsterInETH);
    }

    /// @dev Get the rates of the Etheremon monster
    /// @param _kyberProxy KyberNetworkProxyInterface address
    /// @param token ERC20 token address
    /// @param monsterInETH Price of the monster in ETH
    /// @return expectedRate, slippageRate
    function getMonsterRates(
        KyberNetworkProxyInterface _kyberProxy,
        ERC20 token,
        uint monsterInETH
    )
        public
        view
        returns (
            uint expectedRate,
            uint slippageRate
        )
    {
        // Get the expected and slippage rates of the token to ETH
        (expectedRate, slippageRate) = _kyberProxy.getExpectedRate(token, ETH_TOKEN_ADDRESS, monsterInETH);

        return (expectedRate, slippageRate);
    }

    /// @dev Get the token price and rates of the Etheremon monster
    /// @param token ERC20 token address
    /// @param expectedRate Expected rate of ETH to token
    /// @param monsterInETH Price of the monster in ETH
    /// @return monsterInTokens
    function getMonsterPriceInTokens(
        ERC20 token,
        uint expectedRate,
        uint monsterInETH
    )
        public
        view
        returns (uint monsterInTokens)
    {
        // If expectedRate is 0, return 0 for monster price in tokens
        if (expectedRate == 0) {
            return 0;
        }

        // Calculate monster price in tokens
        monsterInTokens = calcSrcAmount(ETH_TOKEN_ADDRESS, token, monsterInETH, expectedRate);

        return monsterInTokens;
    }

    /// @dev Acquires the monster from Etheremon using tokens
    /// @param _kyberProxy KyberNetworkProxyInterface address
    /// @param _etheremon EtheremonWorldNFT address
    /// @param _classId Class ID of monster
    /// @param _name Name of the monster
    /// @param token ERC20 token address
    /// @param tokenQty Amount of tokens to be transferred by user
    /// @param maxDestQty Actual amount of ETH needed to purchase the monster
    /// @param minRate The minimum rate or slippage rate.
    /// @param walletId Wallet ID where Kyber referral fees will be sent to
    /// @return monsterId
    function catchMonster(
        KyberNetworkProxyInterface _kyberProxy,
        EtheremonWorldNFT _etheremon,
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
        // Check that the player has transferred the token to this contract
        require(token.transferFrom(msg.sender, this, tokenQty));

        // Get the starting token balance of the player's wallet
        uint startTokenBalance = token.balanceOf(this);

        // Mitigate ERC20 Approve front-running attack, by initially setting
        // allowance to 0
        require(token.approve(_kyberProxy, 0));

        // Verify that the token balance has not decreased from front-running
        require(token.balanceOf(this) == startTokenBalance);

        // Once verified, set the token allowance to tokenQty
        require(token.approve(_kyberProxy, tokenQty));

        // Swap player's token to ETH to send to Etheremon payments contract
        uint userETH = _kyberProxy.tradeWithHint(
            token,
            tokenQty,
            ETH_TOKEN_ADDRESS,
            address(this),
            maxDestQty,
            minRate,
            walletId,
            ""
        );

        // Acquire the monster and send to player
        monsterId = _etheremon.catchMonster.value(userETH)(msg.sender, _classId, _name);

        // Log event that monster was caught using tokens
        emit CaughtWithToken(msg.sender, monsterId, token, tokenQty);

        // Return change to player if any
        calcPlayerChange(token, startTokenBalance);

        return monsterId;
    }

    /// @dev Calculates token change and returns to player
    /// @param token ERC20 token address
    /// @param startTokenBalance Starting token balance of the player's wallet
    function calcPlayerChange(ERC20 token, uint startTokenBalance) private {
        // Calculate change of player
        uint change = token.balanceOf(this);

        // Send back change if change is > 0
        if (change > 0) {
            // Log the exchange event
            emit SwapTokenChange(startTokenBalance, change);

            // Transfer change back to player
            token.transfer(msg.sender, change);
        }
    }

    /// @dev Gets the max between two uint params
    /// @param a Param A
    /// @param b Param B
    /// @return result
    function max(uint a, uint b) private pure returns (uint result) {
        return a > b ? a : b;
    }
}
