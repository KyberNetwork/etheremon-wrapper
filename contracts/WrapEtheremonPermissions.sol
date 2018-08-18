pragma solidity ^0.4.24;

contract WrapEtheremonPermissions {
    event TransferAdmin(address newAdmin);
    event OperatorAdded(address newOperator, bool isAdd);

    address public admin;
    address[] public operatorsGroup;
    mapping(address=>bool) internal operators;
    uint constant internal MAX_GROUP_SIZE = 50;

    constructor () public {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    modifier onlyOperator() {
        require(operators[msg.sender]);
        _;
    }

    function transferAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0));
        emit TransferAdmin(newAdmin);
        admin = newAdmin;
    }

    function addOperator(address newOperator) public onlyAdmin {
        require(!operators[newOperator]);
        require(operatorsGroup.length < MAX_GROUP_SIZE);

        emit OperatorAdded(newOperator, true);
        operators[newOperator] = true;
        operatorsGroup.push(newOperator);
    }

    function removeOperator (address operator) public onlyAdmin {
        require(operators[operator]);
        operators[operator] = false;

        for (uint i = 0; i < operatorsGroup.length; ++i) {
            if (operatorsGroup[i] == operator) {
                operatorsGroup[i] = operatorsGroup[operatorsGroup.length - 1];
                operatorsGroup.length -= 1;
                emit OperatorAdded(operator, false);
                break;
            }
        }
    }
}
