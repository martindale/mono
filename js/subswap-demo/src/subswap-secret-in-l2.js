const bitcoin = require('bitcoinjs-lib');
const bip65 = require('bip65');
const Client = require('bitcoin-core');
const { getDescriptorInfo, createRawTransaction } = require('bitcoin-core/src/methods');
const { alice, bob } = require('../bitcoin-test-wallets-generator/wallets.json');
const SwapInfo = require('./swap-info');
const witnessStackToScriptWitness  = require('./bitcoinjs-function/witnessStackToScriptWitness')

const NETWORK = bitcoin.networks.regtest;
const RELATIVE_SWAP_TIMELOCK = 36;
const RELATIVE_PAYMENT_DEADLINE = 24;
const REQUIRED_CONFIRMATIONS = 3;
const DEFAULT_MINER_FEE = 200;

const BITCOIN_RPCPORT = 8332; // <bitcoin.conf-regtest.rpcport>;
const BITCOIN_PASSWORD = '<bitcoin.conf-rpcpassword>';
const BITCOIN_USERNAME = '<bitcoin.conf-rpcuser>';

// --------------------------------
// Sample regtest bitcoin.conf file
// --------------------------------
// regtest=1
// server=1
// rpcuser=<user>
// rpcpassword=<password>
// txindex=1
// zmqpubrawblock=tcp://127.0.0.1:<zmqport>
// zmqpubrawtx=tcp://127:0.0.1:<zmqport>
// minconf=1
// regtest.port=<port>
// regtest.rpcport=<rpcport>
// fallbackfee=0.0002
// rest=1  (temporary)

const SECRET_HOLDER = bitcoin.ECPair.fromWIF(alice[1].wif, NETWORK);
const SECRET_SEEKER = bitcoin.ECPair.fromWIF(bob[1].wif, NETWORK);



async function open(swapHash) {
    const bob = new Client({
        port:       BITCOIN_RPCPORT,
        password:   BITCOIN_PASSWORD,
        username:   BITCOIN_USERNAME,
    });

    const info = await bob.getBlockchainInformation();

    const height = info.blocks;
    const timelock = height +  RELATIVE_SWAP_TIMELOCK;
    const holderPublicKey = SECRET_HOLDER.publicKey.toString('hex');
    const seekerPublicKey = SECRET_SEEKER.publicKey.toString('hex');

    const witnessScriptRaw = scriptGenerator(seekerPublicKey, holderPublicKey, swapHash, timelock);
    const p2wsh = bitcoin.payments.p2wsh({redeem: {output: witnessScriptRaw, NETWORK}, NETWORK})

    const witnessScript = witnessScriptRaw.toString('hex');

    const scriptInfo = await bob.decodeScript(witnessScript);
    const payAddress = scriptInfo.segwit.address;
    const barePayDescriptor = `addr(${payAddress})`;
    const descriptorInfo = await bob.command([{method: 'getdescriptorinfo', parameters: [barePayDescriptor]}]);
    const checksum = descriptorInfo[0].checksum;
    const payDescriptor =  `${barePayDescriptor}#${checksum}`;

    const swapinfo = new SwapInfo.constructor( {descriptor: payDescriptor, witnessScript, timelock});

    return swapinfo;

};

async function commit(secret, swapinfo, amount, fee) {
    const bob = new Client({
        port:       BITCOIN_RPCPORT,
        password:   BITCOIN_PASSWORD,
        username:   BITCOIN_USERNAME,
    });


    const secretSeeker_p2wpkh = bitcoin.payments.p2wpkh({pubkey: SECRET_SEEKER.publicKey, NETWORK});
    const secretSeeker_redeemAddress = secretSeeker_p2wpkh.address;

    const psbt = new bitcoin.Psbt({NETWORK});

    const amountAndFee = amount + fee;

    const scantx = await bob.command([{method: 'scantxoutset', parameters: ['start', [{ "desc": `${swapinfo.descriptor}`}] ]}]);

    // for basic demo - assume one payment
    // later accommodate multiple payments that add up to at least amount + fee with sufficient confirmations for all

    const success = scantx[0].success;
    if (!success) {
        console.log("scan for tx outputs failed")
        return void 0;
        // TODO: throw exception?
    }

    const currentHeight = scantx[0].height;
    const totalAmount = Math.round(scantx[0].total_amount * 10E8);

    const utxos = scantx[0].unspents
    const numUtxos = utxos.length;

    if (numUtxos == 0) {
        console.log('payment not received yet')
        // TODO: determine return contract
        return void 0;
    } else if (numUtxos > 1) {
        console.log(`multiple payments, numUtxos: ${numUtxos}`)
        // TODO: determine return contract and implement handling in time
        return void 0;
    } else if (numUtxos == 1) {
        // current happy path
    } else {
        console.log(`unusual value for numUtxos: ${numUtxos}`)
        // TODO: throw exception?
        return void 0;
    }

    const utxo = utxos[0]
    const paymentTxHeight = utxo.height
    const confirmations = currentHeight - paymentTxHeight + 1;
    if (confirmations < REQUIRED_CONFIRMATIONS) {
        console.log(`insufficient confirmations so far: ${confirmations} (must be 3 or greater)`)    // TODO: determine return contract
        return void 0;
    }

    const timeZero = swapinfo.timelock - RELATIVE_SWAP_TIMELOCK;
    const paymentDeadline = timeZero + RELATIVE_PAYMENT_DEADLINE

    if (paymentTxHeight > paymentDeadline ) {
        console.log(`L1 payment was made late, you really shouldn't have paid the invoice, payment height: ${paymentTxHeight}, payment deadline: ${paymentDeadline}, timelock: ${swapinfo.timelock}`)
        // continue anyway
    }

    if (totalAmount < amountAndFee) {
        console.log(`amount paid insufficient, expect ${amountAndFee}, paid ${totalAmount}`)
        // TODO: determine return contract
        return void 0;
    }

    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffe,
        witnessUtxo: {
            script: Buffer.from('0020' + bitcoin.crypto.sha256(Buffer.from(swapinfo.witnessScript, 'hex')).toString('hex'), 'hex'),
            value: amountAndFee
        },
        witnessScript: Buffer.from(swapinfo.witnessScript, 'hex')
    });

    psbt.addOutput({
        address: secretSeeker_redeemAddress,
        // value: amount
        value: amountAndFee - DEFAULT_MINER_FEE
    });

    psbt.signInput(0, SECRET_SEEKER);

    psbt.finalizeInput(0, (inputIndex, input, script) => {
        const p2wsh = bitcoin.payments.p2wsh({
            redeem: {
                input: bitcoin.script.compile([
                    input.partialSig[inputIndex].signature,
                    Buffer.from(secret, 'hex')
                ]),
                output: Buffer.from(script, 'hex')
            }
        });
        return {
            finalScriptWitness: witnessStackToScriptWitness(p2wsh.witness)
        }
    })
    const transaction = psbt.extractTransaction();
    try {
        const txid = await bob.command([{method: 'sendrawtransaction', parameters: [`${transaction.toHex()}` ]}]);
        return txid;
    } catch( exception ) {
        console.log(`Failed broadcast of commit transaction, exception: ${exception}`)
        return transaction.toHex();
    }

};

async function cancel(swapinfo, amount, fee) {
    const bob = new Client({
        port:       BITCOIN_RPCPORT,
        password:   BITCOIN_PASSWORD,
        username:   BITCOIN_USERNAME,
    });

    const secretHolder_p2wpkh = bitcoin.payments.p2wpkh({pubkey: SECRET_HOLDER.publicKey, NETWORK});
    const secretHolder_redeemAddress = secretHolder_p2wpkh.address;

    const psbt = new bitcoin.Psbt({NETWORK});

    const info = await bob.getBlockchainInformation();
    const height = info.blocks;
    if (height < swapinfo.timelock) {
        const confirmationToGo = swapinfo.timelock - height
        console.log(`Cannot get refund yet, must wait ${confirmationToGo} confirmation(s) more`)
        // TODO: determine return contract
        return void 0;
    }

    psbt.setLocktime(bip65.encode({blocks: parseInt(swapinfo.timelock)}));

    const amountAndFee = amount + fee;
    const scantx = await bob.command([{method: 'scantxoutset', parameters: ['start', [{ "desc": `${swapinfo.descriptor}`}] ]}]);
    const success = scantx[0].success;
    if (!success) {
        console.log("scan for tx outputs failed")
        return void 0;
        // TODO: throw exception?
    }

    const utxos = scantx[0].unspents
    const numUtxos = utxos.length;

    if (numUtxos == 0) {
        console.log('payment not received yet')
        // TODO: determine return contract
        return void 0;
    } else if (numUtxos > 1) {
        console.log(`multiple payments, numUtxos: ${numUtxos}`)
        // TODO: determine return contract and implement handling in time
        return void 0;
    } else if (numUtxos == 1) {
        // current happy path
    } else {
        console.log(`unusual value for numUtxos: ${numUtxos}`)
        // TODO: throw exception?
        return void 0;
    }
    const currentHeight = scantx[0].height;
    const utxo = utxos[0]
    const paymentTxHeight = utxo.height
    const confirmations = currentHeight - paymentTxHeight + 1;
    if (confirmations < REQUIRED_CONFIRMATIONS) {
        console.log(`insufficient confirmations so far: ${confirmations} (must be 3 or greater)`)
        // TODO: determine return contract
        return void 0;
    }

    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffe,
        witnessUtxo: {
            script: Buffer.from('0020' + bitcoin.crypto.sha256(Buffer.from(swapinfo.witnessScript, 'hex')).toString('hex'), 'hex'),
            value: amountAndFee
        },
        witnessScript: Buffer.from(swapinfo.witnessScript, 'hex')
    });


    psbt.addOutput({
        address: secretHolder_redeemAddress,
        // value: amount
        value: amountAndFee - DEFAULT_MINER_FEE
    });

    psbt.signInput(0, SECRET_HOLDER);

    psbt.finalizeInput(0, (inputIndex, input, script) => {
        const p2wsh = bitcoin.payments.p2wsh({
            redeem: {
                input: bitcoin.script.compile([
                    input.partialSig[inputIndex].signature,
                    Buffer.from('', 'hex')
                ]),
                output: Buffer.from(script, 'hex')
            }
        });
        return {
            finalScriptWitness: witnessStackToScriptWitness(p2wsh.witness)
        }
    })
    const transaction = psbt.extractTransaction();
    try {
        const txid = await bob.command([{method: 'sendrawtransaction', parameters: [`${transaction.toHex()}` ]}]);
        return txid;
    } catch( exception ) {
        console.log(`Failed broadcast of refund transaction, exception: ${exception}`)
        return transaction.toHex();
    }
};

const scriptGenerator = function(secretSeekerPublicKey,  secretHolderPublicKey, swapHash, timelock) {
    return bitcoin.script.fromASM(
        `
        OP_HASH160
        ${bitcoin.crypto.ripemd160(Buffer.from(swapHash, 'hex')).toString('hex')}
        OP_EQUAL
        OP_IF
            ${secretSeekerPublicKey}
        OP_ELSE
            ${bitcoin.script.number.encode(timelock).toString('hex')}
            OP_CHECKLOCKTIMEVERIFY
            OP_DROP
            ${secretHolderPublicKey}
        OP_ENDIF
        OP_CHECKSIG
        `
            .trim()
            .replace(/\s+/g, ' ')
    );
};

module.exports = {
    open,
    commit,
    cancel
}
