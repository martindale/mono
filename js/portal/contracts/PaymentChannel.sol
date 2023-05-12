/// SPDX-License-Identifier: UNLICENSED
pragma solidity "*";

import "./IERC20.sol";
import "./ECDSA.sol";
import "./ReentrancyGuard.sol";


contract PaymentChannel is ReentrancyGuard {
    using ECDSA for bytes32;

    struct Channel {
        address sender;
        address receiver;
        uint deposited;
        uint claimed;
        address token;
    }

    mapping(uint => Channel) public channels;

    event Deposited(uint channelId, address sender, uint value, uint deposited, address token);
    event ChannelOpened(uint channelId, address sender, address receiver, uint value, address token);
    event Settled(uint channelId, address sender, address receiver, uint withdrawing, uint spent, address token);

    //////////////////////////////////////////////////////////////////
    // CHANNEL ID
    function getChannelId(address _sender, address _receiver, address _token) public view returns (uint channelId) {
        return uint(getChannelIdHex(_sender, _receiver, _token));
    }

    // solhint-disable-next-line max-line-length
    function getChannelIdHex(address _sender, address _receiver, address _token) public view returns (bytes32 channelId) {
        return keccak256(getChannelIdPreimage(_sender, _receiver, _token));
    }

    // solhint-disable-next-line max-line-length
    function getChannelIdPreimage(address _sender, address _receiver, address _token) public view returns (bytes memory channelInfo) {
        return abi.encodePacked(address(this), _sender, _receiver, _token);
    }

    //////////////////////////////////////////////////////////////////
    // OPEN CHANNEL
    function _openChannel(address payable _receiver, uint _amount, address _token) internal returns(uint _channelId) {
        require(_receiver != address(0), "receiver = zero address");

        //TODO don't allow overwriting channels for actual use, but for testing it's desired

        uint channelId = getChannelId(msg.sender, _receiver, _token);

        channels[channelId] = Channel({
            sender: msg.sender,
            receiver: _receiver,
            deposited: _amount,
            claimed: 0,
            token: _token
        });

        if (_token != address(0)) {
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        } else {
            require(_amount == msg.value, "msg.value not qual to _amount");
        }

        emit ChannelOpened(channelId, msg.sender, _receiver, _amount, _token);

        return channelId;
    }

    function openChannel(address payable _receiver, uint _amount, address _token) external payable returns(uint channelId) {
        return _openChannel(_receiver, _amount, _token);
    }

    function openChannelEth(address payable _receiver) external payable returns(uint channelId) {
        return _openChannel(_receiver, msg.value, address(0));
    }


    //////////////////////////////////////////////////////////////////
    // DEPOSIT TO CHANNEL

    function _deposit(uint _channelId, uint _amount, address _token) private returns (bool success) {
        Channel storage channel = channels[_channelId];
        channel.deposited += _amount;

        if(_token != address(0)) {
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        } else {
            require(_amount == msg.value, "msg.value not qual to _amount");
        }

        emit Deposited(_channelId, msg.sender, _amount, channel.deposited, _token);

        return true;
    }

    function depositEth(uint _channelId) external payable returns (bool success) {
        return _deposit(_channelId, msg.value, address(0));
    }

    function deposit(uint _channelId, uint _amount, address _token) external payable returns (bool success) {
        return _deposit(_channelId, _amount, _token);
    }

    //////////////////////////////////////////////////////////////////
    // PAYMENT HASHES AND SIG VERIFY

    function _getHash(uint _channelId, uint _amount) private view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), _channelId, _amount));
    }

    function getHash(uint _channelId, uint _amount) external view returns (bytes32) {
        return _getHash(_channelId, _amount);
    }

    function _getEthSignedHash(uint _channelId, uint _amount) private view returns (bytes32) {
        return _getHash(_channelId, _amount).toEthSignedMessageHash();
    }

    function getEthSignedHash(uint _channelId, uint _amount) external view returns (bytes32) {
        return _getEthSignedHash(_channelId, _amount);
    }

    function _verify(uint _channelId, uint _amount, bytes memory _sig) private view returns (bool) {
        return _getEthSignedHash(_channelId, _amount).recover(_sig) == channels[_channelId].sender;
    }

    function verify(uint _channelId, uint _amount, bytes memory _sig) external view returns (bool) {
        return _verify(_channelId, _amount, _sig);
    }


    //////////////////////////////////////////////////////////////////
    // CAPACITY

    function _capacity(Channel memory _channel) internal pure returns (uint){
        return _channel.deposited - _channel.claimed;
    }

    function capacity(uint _channelId) public view returns (uint){
        Channel storage channel = channels[_channelId];
        return _capacity(channel);
    }


    //////////////////////////////////////////////////////////////////
    // SETTLEMENT
    function settle(uint _channelId, uint _amount, bytes memory _sig) external nonReentrant returns(bool success) {
        //  verifing signature
        require(_verify(_channelId, _amount, _sig), "invalid signature");

        Channel storage channel = channels[_channelId];

        uint withdrawing = _amount - channel.claimed;

        require(_capacity(channel) > withdrawing, "insufficient capacity");

        if (channel.token == address(0)) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool sent, ) = channel.receiver.call {value: withdrawing}("");
            require(sent, "Failed to send Ether");
        } else {
            IERC20(channel.token).transfer(msg.sender, withdrawing);
        }

        channel.claimed = _amount;

        emit Settled(_channelId, channel.sender, channel.receiver, withdrawing, _amount, channel.token);

        return true;
    }
}
