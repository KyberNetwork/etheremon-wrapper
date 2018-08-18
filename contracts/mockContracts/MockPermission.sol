pragma solidity ^0.4.24;

import "../WrapEtheremonPermissions.sol";

contract MockPermission is WrapEtheremonPermissions {
    uint public rate;
    bool public tradeActive = true;

    constructor () public WrapEtheremonPermissions() { }

    function stopTrade () public
        onlyOperator
    {
        tradeActive = false;
    }

    function activateTrade () public
        onlyOperator
    {
        tradeActive = true;
    }
}
