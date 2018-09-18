pragma solidity ^0.4.24;

import "./kyberContracts/ERC20Interface.sol";
import "./kyberContracts/KyberNetworkProxyInterface.sol";
import "./etheremonContracts/EtheremonWorldNFT.sol";


/// @title WrapEtheremon Interface
interface WrapEtheremonInterface {
    /// @notice Can only be called by operators
    /// @dev Sets the KyberNetwork address
    /// @param _KyberNetwork KyberNetwork contract address
    function setKyberNetwork(address _KyberNetwork) public;

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
        );

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
        );

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
        returns (uint monsterInTokens);

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
        returns (uint monsterId);
}
