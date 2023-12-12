/// SPDX-License-Identifier: UNLICENSED
pragma solidity "*";

import "./IERC20.sol";

/// A smart contract that implements one half of a cross-chain atomic swap,
/// enabling the transfer of native ETH or any ERC-20 token on one EVM chain.
contract Swap {
    ///////////////////////////////////////////////////////////////////////////
    // Internal state
    ///////////////////////////////////////////////////////////////////////////
    mapping(bytes32 => bool) private ids;
    mapping(bytes32 => bytes32) private swaps;
    mapping(bytes32 => address payable) private payees;
    mapping(bytes32 => address) private payers;
    mapping(bytes32 => address) private assets;
    mapping(bytes32 => uint) private quantities;

    /// Fired when an invoice is created by the payee
    event InvoiceCreated(
        bytes32 indexed id,
        bytes32 indexed swap,
        address payee,
        address asset,
        uint quantity
    );

    /// Fired when an invoice is paid by the payer
    event InvoicePaid(
        bytes32 indexed id,
        bytes32 indexed swap,
        address payer,
        address asset,
        uint quantity
    );

    /// Fired when an invoice is settled by the payer
    event InvoiceSettled(
        bytes32 indexed id,
        bytes32 indexed swap,
        address payer,
        address payee,
        address asset,
        uint quantity,
        bytes32 secret
    );

    /// Creates a new invoice
    function createInvoice(
        bytes32 id,
        bytes32 swap,
        address asset,
        uint quantity) public {

        // ensure the hash of secret is not already in use
        require(ids[id] == false, "Secret hash already in use!");

        // update the internal state of the contract
        ids[id] = true;
        swaps[id] = swap;
        payees[id] = payable(msg.sender);
        assets[id] = asset;
        quantities[id] = quantity;

        // emit the invoice created event
        emit InvoiceCreated(
            id,
            swaps[id],
            payees[id],
            assets[id],
            quantities[id]
        );
    }

    /// Pays an invoice
    function payInvoice(
        bytes32 id,
        bytes32 swap,
        address asset,
        uint quantity) public payable {

        // ensure the invoice is valid
        require(ids[id] == true, "Incorrect invoice!");
        require(swaps[id] == swap, "Incorrect swap!");
        require(assets[id] == asset, "Incorrect asset!");
        require(quantities[id] == quantity, "Incorrect asset quantity!");

        // For native ETH, validate the ETH amount sent
        // For ERC-20 tokens, transfer the tokens into the contract
        if (asset == address(0x0)) {
            require(quantities[id] == msg.value, "Incorrect asset quantity!");
        } else {
            IERC20 erc20 = IERC20(asset);
            erc20.transferFrom(msg.sender, address(this), quantity);
        }
        payers[id] = msg.sender;

        // emit the invoice paid event
        emit InvoicePaid(
            id,
            swaps[id],
            payers[id],
            assets[id],
            quantities[id]
        );
    }

    /// Settles an invoice
    function settleInvoice(
        bytes32 secret,
        bytes32 swap) public {

        // generate the hash of the secret
        bytes32 id = sha256(abi.encodePacked(secret));

        // ensure the invoice is valid
        require(ids[id] == true, "No invoice found for the provided secret!");
        require(swaps[id] == swap, "No swap found for the provided secret!");
        require(payees[id] == msg.sender, "Incorrect payee!");

        // save the state locally before clearing it out
        address payable payee = payees[id];
        address payer = payers[id];
        address asset = assets[id];
        uint quantity = quantities[id];

        // delete all state
        delete ids[id];
        delete swaps[id];
        delete payees[id];
        delete payers[id];
        delete assets[id];
        delete quantities[id];

        // transfer the asset to the payee
        if (asset == address(0x0)) {
            payee.transfer(quantity);
        } else {
            IERC20 erc20 = IERC20(asset);
            erc20.transfer(payee, quantity);
        }

        // emit the invoice settled event
        emit InvoiceSettled(id, swap, payer, payee, asset, quantity, secret);
    }
}
