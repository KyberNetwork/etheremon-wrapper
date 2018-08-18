function toHexString(byteArray) {
  return Array.from(byteArray, (byte) => {
    return (`0${((byte & 0xFF).toString(16)).slice(-2)}`);
  }).join('');
};

module.exports.isRevertErrorMessage = (error) => {
    if (error.message.search('invalid opcode') >= 0) return true;
    if (error.message.search('revert') >= 0) return true;
    if (error.message.search('out of gas') >= 0) return true;

    return false;
};

module.exports.sendEtherWithPromise = (sender, recv, amount) => {
    return new Promise((fulfill, reject) => {
        web3.eth.sendTransaction({ to: recv, from: sender, value: amount }, (error, result) => {
            if (error) {
                return reject(error);
            } else {
                return fulfill(true);
            }
        });
    });
};

module.exports.getBalancePromise = (account) => {
    return new Promise((fulfill, reject) => {
        web3.eth.getBalance(account, (err,result) => {
            if (err) {
                reject(err);
            } else {
                fulfill(result);
            }
        });
    });
};

module.exports.getCurrentBlock = () => {
    return new Promise((fulfill, reject) => {
        web3.eth.getBlockNumber((err, result) => {
            if (err) {
                reject(err);
            } else {
                fulfill(result);
            }
        });
    });
};

module.exports.bytesToHex = (byteArray) => {
    return `0x${toHexString(byteArray)}`;
};

module.exports.sendPromise = (method, params) => {
    return new Promise((fulfill, reject) => {
        web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method,
          params: params || [],
          id: new Date().getTime(),
        }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                fulfill(result);
            }
        });
    });
};
