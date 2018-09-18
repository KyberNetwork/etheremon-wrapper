pragma solidity ^0.4.23;

import "./EtheremonData.sol";
import "./EtheremonMonsterNFTInterface.sol";


contract EtheremonWorldNFT is BasicAccessControl {
    uint8 constant public STAT_COUNT = 6;
    uint8 constant public STAT_MAX = 32;

    struct MonsterClassAcc {
        uint32 classId;
        uint256 price;
        uint256 returnPrice;
        uint32 total;
        bool catchable;
    }

    struct MonsterObjAcc {
        uint64 monsterId;
        uint32 classId;
        address trainer;
        string name;
        uint32 exp;
        uint32 createIndex;
        uint32 lastClaimIndex;
        uint createTime;
    }

    address public dataContract;
    address public monsterNFT;

    mapping(uint32 => bool) public classWhitelist;
    mapping(address => bool) public addressWhitelist;

    uint public gapFactor = 5;
    uint public priceIncreasingRatio = 1000;

    function setContract(address _dataContract, address _monsterNFT) external onlyModerators {
        dataContract = _dataContract;
        monsterNFT = _monsterNFT;
    }

    function setConfig(uint _gapFactor, uint _priceIncreasingRatio) external onlyModerators {
        gapFactor = _gapFactor;
        priceIncreasingRatio = _priceIncreasingRatio;
    }

    function setClassWhitelist(uint32 _classId, bool _status) external onlyModerators {
        classWhitelist[_classId] = _status;
    }

    function setAddressWhitelist(address _smartcontract, bool _status) external onlyModerators {
        addressWhitelist[_smartcontract] = _status;
    }

    function mintMonster(uint32 _classId, address _trainer, string _name) external onlyModerators returns(uint) {
        EtheremonDataBase data = EtheremonDataBase(dataContract);
        // add monster
        uint64 objId = data.addMonsterObj(_classId, _trainer, _name);
        uint8 value;
        uint seed = getRandom(_trainer, block.number-1, objId);
        // generate base stat for the previous one
        for (uint i=0; i < STAT_COUNT; i += 1) {
            seed /= 100;
            value = uint8(seed % STAT_MAX) + data.getElementInArrayType(EtheremonEnum.ArrayType.STAT_START, uint64(_classId), i);
            data.addElementToArrayType(EtheremonEnum.ArrayType.STAT_BASE, objId, value);
        }

        EtheremonMonsterNFTInterface(monsterNFT).triggerTransferEvent(address(0), _trainer, objId);
        return objId;
    }

    function burnMonster(uint64 _tokenId) external onlyModerators {
        // need to check condition before calling this function
        EtheremonDataBase data = EtheremonDataBase(dataContract);
        MonsterObjAcc memory obj;
        (obj.monsterId, obj.classId, obj.trainer, obj.exp, obj.createIndex, obj.lastClaimIndex, obj.createTime) = data.getMonsterObj(_tokenId);
        require(obj.trainer != address(0));
        data.removeMonsterIdMapping(obj.trainer, _tokenId);
        EtheremonMonsterNFTInterface(monsterNFT).triggerTransferEvent(obj.trainer, address(0), _tokenId);
    }

    function catchMonsterNFT(uint32 _classId, string _name) external isActive payable {
        EtheremonDataBase data = EtheremonDataBase(dataContract);
        MonsterClassAcc memory class;
        (class.classId, class.price, class.returnPrice, class.total, class.catchable) = data.getMonsterClass(_classId);
        if (class.classId == 0 || class.catchable == false) {
            revert();
        }

        uint price = class.price;
        if (class.total > 0)
            price += class.price*(class.total-1)/priceIncreasingRatio;
        if (msg.value < price) {
            revert();
        }

        // add new monster
        uint64 objId = data.addMonsterObj(_classId, msg.sender, _name);
        uint8 value;
        uint seed = getRandom(msg.sender, block.number-1, objId);
        // generate base stat for the previous one
        for (uint i=0; i < STAT_COUNT; i += 1) {
            seed /= 100;
            value = uint8(seed % STAT_MAX) + data.getElementInArrayType(EtheremonEnum.ArrayType.STAT_START, uint64(_classId), i);
            data.addElementToArrayType(EtheremonEnum.ArrayType.STAT_BASE, objId, value);
        }

        EtheremonMonsterNFTInterface(monsterNFT).triggerTransferEvent(address(0), msg.sender, objId);
        // refund extra
        if (msg.value > price) {
            msg.sender.transfer((msg.value - price));
        }
    }

    // for whitelist contracts, no refund extra
    function catchMonster(address _player, uint32 _classId, string _name) external isActive payable returns(uint tokenId) {
        if (addressWhitelist[msg.sender] == false) {
            revert();
        }

        EtheremonDataBase data = EtheremonDataBase(dataContract);
        MonsterClassAcc memory class;
        (class.classId, class.price, class.returnPrice, class.total, class.catchable) = data.getMonsterClass(_classId);
        if (class.classId == 0) {
            revert();
        }

        if (class.catchable == false && classWhitelist[_classId] == false) {
            revert();
        }

        uint price = class.price;
        if (class.total > gapFactor) {
            price += class.price*(class.total - gapFactor)/priceIncreasingRatio;
        }
        if (msg.value < price) {
            revert();
        }

        // add new monster
        uint64 objId = data.addMonsterObj(_classId, _player, _name);
        uint8 value;
        uint seed = getRandom(_player, block.number-1, objId);
        // generate base stat for the previous one
        for (uint i=0; i < STAT_COUNT; i += 1) {
            seed /= 100;
            value = uint8(seed % STAT_MAX) + data.getElementInArrayType(EtheremonEnum.ArrayType.STAT_START, uint64(_classId), i);
            data.addElementToArrayType(EtheremonEnum.ArrayType.STAT_BASE, objId, value);
        }

        EtheremonMonsterNFTInterface(monsterNFT).triggerTransferEvent(address(0), _player, objId);
        return objId;
    }

    function getMonsterClassBasic(uint32 _classId) external constant returns(uint256, uint256, uint256, bool) {
        EtheremonDataBase data = EtheremonDataBase(dataContract);
        MonsterClassAcc memory class;
        (class.classId, class.price, class.returnPrice, class.total, class.catchable) = data.getMonsterClass(_classId);
        return (class.price, class.returnPrice, class.total, class.catchable);
    }

    function getPrice(uint32 _classId) external constant returns(bool catchable, uint price) {
        EtheremonDataBase data = EtheremonDataBase(dataContract);
        MonsterClassAcc memory class;
        (class.classId, class.price, class.returnPrice, class.total, class.catchable) = data.getMonsterClass(_classId);

        price = class.price;
        if (class.total > 0)
            price += class.price*(class.total-1)/priceIncreasingRatio;

        if (class.catchable == false) {
            return (classWhitelist[_classId], price);
        } else {
            return (true, price);
        }
    }

    // public api
    function getRandom(address _player, uint _block, uint _count) public view returns(uint) {
        return uint(keccak256(abi.encodePacked(blockhash(_block), _player, _count)));
    }

    function withdrawEther(address _sendTo, uint _amount) public onlyOwner {
        if (_amount > address(this).balance) {
            revert();
        }
        _sendTo.transfer(_amount);
    }
}
