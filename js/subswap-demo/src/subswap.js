#!/usr/bin/env node

const program = require('commander');
const normalSubswap = require('./subswap-secret-in-l2');
const SwapInfo = require("./swap-info");


program
    .version('0.1.0');

program.command('open')
    .argument('<swap-hash>', 'hash of swap secret (in hex)')
    .action(async (hash) => {
        console.log('\nOpening submarine swap...');
        try {
            const swapinfo = await normalSubswap.open(hash);
            if (swapinfo != undefined) {
                console.log(`swapinfo: ${JSON.stringify(swapinfo)}\n`);
            } else {
                console.log("No result")
            }
        } catch(e) {
            console.error(e);
        }

    });

program.command('commit')
    .argument('<swap-secret>', 'swap secret (in hex)')
    .argument('<descriptor>', 'swap L1 payment address descriptor')
    .argument('<witness-script>', 'witness script (in hex)')
    .argument('<timelock>', 'timelock')
    .argument('<swap-amount>', 'swap amount (in sats)')
    .argument('<swap-fee>', 'swap-fee (in sats)') // TODO: differentiate provider and miner fees
    .action(async (secret, descriptor, witnessScript, timelock, amountString, feeString) => {
        console.log('\nCommitting submarine swap...');

        const swapinfo = new SwapInfo.constructor({descriptor, witnessScript, timelock});
        const amount = parseInt(amountString, 10)
        const fee = parseInt(feeString, 10)
        const commitTransaction = await normalSubswap.commit(secret, swapinfo, amount, fee);
        if (commitTransaction != undefined) {
            console.log(`commitTransaction: ${commitTransaction}`)
        } else {
            // console.log('\n')
        }
    })

program.command('cancel')
    .argument('<descriptor>', 'swap L1 payment address descriptor')
    .argument('<witness-script>', 'witness script (in hex)')
    .argument('<timelock>', 'timelock')
    .argument('<swap-amount>', 'swap amount (in sats)')
    .argument('<swap-fee>', 'swap-fee (in sats)')
    .action(async (descriptor, witnessScript, timelock, amountString, feeString) => {
        console.log('\nCancelling submarine swap...');
        const amount = parseInt(amountString, 10)
        const fee = parseInt(feeString, 10)
        const swapinfo = new SwapInfo.constructor({descriptor, witnessScript, timelock});
        const refundTransaction = await normalSubswap.cancel(swapinfo, amount, fee);
        if (refundTransaction != undefined) {
            console.log(`refundTransaction: ${refundTransaction}`)
        } else {
            // console.log('\n')
        }

    })

program.parse();