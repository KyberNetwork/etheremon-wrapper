pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";


contract TestToken is MintableToken, StandardBurnableToken {
    string public name = "TestToken";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    uint public totalSupply = 21 * (10 ** 24);

    constructor (string _name, string _symbol, uint8 _decimals) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balances[msg.sender] = totalSupply;
    }
}
