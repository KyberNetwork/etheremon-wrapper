pragma solidity ^0.4.24;

import "../kyberContracts/Utils2.sol";

contract MockUtils2 is Utils2 {
    function mockCalcSrcAmount(ERC20 src, ERC20 dest, uint destAmount, uint rate) internal view returns(uint) {
        return calcSrcAmount(ERC20 src, ERC20 dest, uint destAmount, uint rate);
    }
}
