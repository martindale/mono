/// SPDX-License-Identifier: UNLICENSED
pragma solidity "*";

import "./IERC20.sol";


/// A smart contract that implements one-half of a swap, enabling the transfer
/// of native ETH or any ERC-20 token on one EVM chain.
contract Swap {
    ////////////////////////////////////////////////////////////////////
    // Invoices
    ////////////////////////////////////////////////////////////////////
    uint public invoiceCount = 0;
    mapping(uint => address) public invoiceCreators;
    mapping(uint => address) public invoiceTokenAddresses;
    mapping(uint => uint) public invoiceTokenNetworks;
    mapping(uint => uint) public invoiceTokenAmounts;
    mapping(uint => uint) public hashToInvoice;
    mapping(uint => bytes32) public invoiceToHash;

    event InvoiceCreated(
        uint invoiceId,
        address tokenAddress,
        uint tokenAmount,
        uint tokenNetwork,
        address indexed invoicer);

    event InvoicePaid(
        uint indexed invoiceId,
        bytes32 secretHash,
        address indexed payee,
        address indexed payer);

    function createInvoice(
        address tokenAddress,
        uint tokenAmount,
        uint tokenNetwork) public returns(uint) {

        invoiceCount++;

        invoiceCreators[invoiceCount] = msg.sender;
        invoiceTokenAddresses[invoiceCount] = tokenAddress;
        invoiceTokenAmounts[invoiceCount] = tokenAmount;
        invoiceTokenNetworks[invoiceCount] = tokenNetwork;

        emit InvoiceCreated(
            invoiceCount,
            tokenAddress,
            tokenAmount,
            tokenNetwork,
            msg.sender);

        return invoiceCount;
    }

    function payInvoice(
        uint invoiceId,
        bytes32 secretHash) public payable returns (bool) {

        //if it's native ETH call payable function, otherwise pull token funds
        if (invoiceTokenAddresses[invoiceId] == address(0x0)) {
            require(
                invoiceTokenAmounts[invoiceId] == msg.value,
                "wrong eth amount");

            //TODO: replace the ZERO placeholders with actual desired token info
            depositEth(
                address(0x0),
                0, //TODO: put actual desired token data
                0, //TODO: put actual desired token data
                secretHash,
                invoiceCreators[invoiceId]);
        } else {
            //TODO: replace the ZERO placeholders with actual desired token info
            deposit(
                invoiceTokenAddresses[invoiceId],
                invoiceTokenAmounts[invoiceId],
                address(0x0),
                0, //TODO: put actual desired token data
                0, //TODO: put actual desired token data
                secretHash,
                invoiceCreators[invoiceId]);
        }

        invoiceToHash[invoiceId] = secretHash;
        hashToInvoice[uint(secretHash)] = invoiceId;

        emit InvoicePaid(invoiceId, secretHash, invoiceCreators[invoiceCount], msg.sender);
        return true;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Token Deposit and Claim
    ////////////////////////////////////////////////////////////////////////////
    mapping(uint => bool) public hashes;
    mapping(uint => bool) public claimed;
    mapping(uint => uint) public amounts;
    mapping(uint => uint) public secrets;
    mapping(uint => address) public recipients;
    mapping(uint => address) public senders;
    mapping(uint => address) public tokenAddresses;

    ////////////////////////////////////////////////////////////////////////////
    // deposit and claim
    ////////////////////////////////////////////////////////////////////////////
    event Deposited(
        uint trade,
        address tokenDeposited,
        uint amountDeposited,
        address tokenDesired,
        uint amountDesired,
        uint networkDesired,
        bytes32 indexed secretHash,
        address indexed recipient,
        address indexed sender);

    event Claimed(
        uint trade,
        bytes32 secret,
        bytes32 indexed secretHash,
        address indexed claimant,
        address indexed sender);

    function deposit(
        address tokenDeposited,
        uint amountDeposited,
        address tokenDesired,
        uint amountDesired,
        uint networkDesired,
        bytes32 secretHash,
        address recipient) public returns (uint secretHashNumber) {

        secretHashNumber = uint(secretHash);

        hashes[secretHashNumber] = true;
        recipients[secretHashNumber] = recipient;
        senders[secretHashNumber] = msg.sender;
        amounts[secretHashNumber] = amountDeposited;
        tokenAddresses[secretHashNumber] = tokenDeposited;

        IERC20 erc20 = IERC20(tokenDeposited);
        erc20.transferFrom(msg.sender, address(this), amountDeposited);

        emit Deposited(
            secretHashNumber,
            tokenDeposited,
            amountDeposited,
            tokenDesired,
            amountDesired,
            networkDesired,
            secretHash,
            recipient,
            msg.sender);

        return secretHashNumber;
    }

    function depositEth(
        address tokenDesired,
        uint amountDesired,
        uint networkDesired,
        bytes32 secretHash,
        address recipient) public payable returns(uint secretHashNumber) {

        secretHashNumber = uint(secretHash);

        hashes[secretHashNumber] = true;
        amounts[secretHashNumber] = msg.value;
        recipients[secretHashNumber] = recipient;
        tokenAddresses[secretHashNumber] = address(0x0);
        senders[secretHashNumber] = msg.sender;

        emit Deposited(
            secretHashNumber,
            address(0x0),
            msg.value,
            tokenDesired,
            amountDesired,
            networkDesired,
            secretHash,
            recipient,
            msg.sender);

        return secretHashNumber;
    }

    function claim(uint secret) public returns (bool) {
        bytes32 secretHash = toHash(secret);
        uint secretHashNumber = uint(secretHash);

        require(hashes[secretHashNumber], "Invalid secret!");
        require(!claimed[secretHashNumber], "Already claimed!");
        require(recipients[secretHashNumber] == msg.sender, "Invalid claimant!");

        secrets[secretHashNumber] = secret;
        claimed[secretHashNumber] = true;

        if (tokenAddresses[secretHashNumber] == address(0x0)) {
            msg.sender.transfer(amounts[secretHashNumber]);
        } else {
            IERC20 erc20 = IERC20(tokenAddresses[secretHashNumber]);
            erc20.transfer(msg.sender, amounts[secretHashNumber]);
        }

        emit Claimed(secretHashNumber, bytes32(secret), secretHash, msg.sender, senders[secretHashNumber]);

        return true;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Utility functions
    ////////////////////////////////////////////////////////////////////////////
    function toHash(uint secret) public pure returns (bytes32 secretHash) {
        secretHash = sha256(toBytes(secret));
    }

    function toBytes(uint256 x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        // solhint-disable-next-line no-inline-assembly
        assembly { mstore(add(b, 32), x) }
        return b;
    }
}
